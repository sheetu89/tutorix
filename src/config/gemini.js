import { GoogleGenerativeAI } from "@google/generative-ai";

// Use the base API URL (not a model-specific endpoint). Let model selection happen per-call.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY, {
  apiUrl: "https://generativelanguage.googleapis.com/v1",
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const validateModuleContent = (content) => {
  if (!content?.title || !Array.isArray(content?.sections)) return false;
  if (content.sections.length === 0) return false;
  
  // Validate each section has required fields
  return content.sections.every(section => 
    section.title && 
    typeof section.content === 'string' && 
    section.content.length > 50
  );
};

const cleanCodeExample = (codeExample) => {
  if (!codeExample) return null;
  try {
    // Clean any markdown code blocks from the code
    const cleanCode = codeExample.code
      ?.replace(/```[\w]*\n?/g, '')  // Remove code block markers
      ?.replace(/```$/gm, '')        // Remove ending markers
      ?.replace(/^\/\/ /gm, '')      // Clean comments
      ?.trim();

    return {
      language: codeExample.language || 'javascript',
      code: cleanCode || '',
      explanation: codeExample.explanation || ''
    };
  } catch (error) {
    console.error('Code cleaning error:', error);
    return null;
  }
};

const sanitizeContent = (text) => {
  try {
    // Remove markdown code blocks and other problematic characters
    return text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/`/g, '')
      .replace(/\\n/g, '\n')
      .replace(/\\\\/g, '\\')
      .trim();
  } catch (error) {
    console.error('Content sanitization error:', error);
    return text;
  }
};

const sanitizeJSON = (text) => {
  try {
    console.log('[sanitizeJSON] Input length:', text.length);
    
    // Remove markdown code blocks first
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON object from the response (find the outermost braces)
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1) {
      console.warn('[sanitizeJSON] No JSON object found');
      return text;
    }
    
    cleaned = cleaned.substring(startIdx, endIdx + 1);
    
    console.log('[sanitizeJSON] Extracted JSON length:', cleaned.length);
    
    // Try to parse directly first (this works in Node.js)
    try {
      const testParse = JSON.parse(cleaned);
      console.log('[sanitizeJSON] ✅ Direct parse successful!');
      return cleaned;
    } catch (directParseError) {
      console.log('[sanitizeJSON] Direct parse failed:', directParseError.message);
      console.log('[sanitizeJSON] Error at:', directParseError.toString());
      
      // Browser JSON.parse might be stricter - try normalizing
      // Remove ALL actual newlines, tabs, etc - they should be escaped in JSON strings
      let normalized = cleaned
        .replace(/\r\n/g, '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(/\t/g, '');
      
      console.log('[sanitizeJSON] Trying with all newlines/tabs removed...');
      try {
        const testParse2 = JSON.parse(normalized);
        console.log('[sanitizeJSON] ✅ Success after removing newlines!');
        return normalized;
      } catch (normalizedError) {
        console.error('[sanitizeJSON] Still failed:', normalizedError.message);
        // Return original cleaned version
        return cleaned;
      }
    }
  } catch (error) {
    console.error('[sanitizeJSON] Error:', error);
    return text;
  }
};

// Decode raw base64 payloads returned by the model. This expects the model
// to return ONLY a raw base64 string (no fences, no JSON wrapper). If the
// response contains a fenced block or a JSON {"b64":"..."} wrapper, this
// helper will attempt to extract and decode it as well.
const decodeBase64Payload = (text) => {
  if (!text || typeof text !== 'string') throw new Error('No text to decode');

  // Strip surrounding fences if present
  let cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/\s*```\s*$/g, '').trim();

  // If JSON wrapper {"b64":"..."} exists, extract it
  const b64JsonMatch = cleaned.match(/"b64"\s*:\s*"([A-Za-z0-9+/=]+)"/);
  if (b64JsonMatch && b64JsonMatch[1]) cleaned = b64JsonMatch[1];

  // If cleaned looks like a raw base64 string, decode it
  const rawB64Match = cleaned.match(/^\s*([A-Za-z0-9+/=]{20,})\s*$/m);
  const b64str = rawB64Match ? rawB64Match[1] : null;
  if (!b64str) throw new Error('No base64 payload found in model response');

  let decoded;
  if (typeof atob === 'function') {
    decoded = atob(b64str);
  } else if (typeof Buffer !== 'undefined') {
    decoded = Buffer.from(b64str, 'base64').toString('utf8');
  } else {
    throw new Error('No base64 decoder available in this environment');
  }

  try {
    return JSON.parse(decoded);
  } catch (e) {
    // If decoded payload is not JSON, return raw string
    return decoded;
  }
};

// Fallback model list - verified working models (tested Oct 2025)
// Latest free models available: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
// You can override by setting VITE_GEMINI_MODEL in your .env
const FALLBACK_MODELS = [
  import.meta.env.VITE_GEMINI_MODEL,
  "gemini-2.5-flash",      // Latest fast model (1M tokens, 65K output)
  "gemini-2.5-pro",         // Latest pro model (1M tokens, 65K output)
  "gemini-2.0-flash-001",   // Stable 2.0 version
  "gemini-2.0-flash",       // 2.0 Flash fallback
].filter(Boolean);

// Helper: try to generate with a list of models until one succeeds.
const tryGenerateWithFallbacks = async (prompt, opts = {}) => {
  const errors = [];

  console.log(`[tryGenerateWithFallbacks] Attempting models:`, FALLBACK_MODELS);

  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[tryGenerateWithFallbacks] Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt, opts);
      console.log(`[tryGenerateWithFallbacks] ✅ Success with model: ${modelName}`);
      return result;
    } catch (err) {
      // collect error and continue to next candidate
      console.warn(`[tryGenerateWithFallbacks] ❌ Model ${modelName} failed:`, err?.message || err);
      errors.push({ model: modelName, error: err });
      // if the error is not a 404/model-not-found style, stop early
      const msg = err?.message || '';
      if (!/not found|not supported|404|Model .* not found/i.test(msg)) {
        console.error(`[tryGenerateWithFallbacks] Non-404 error, stopping fallback attempts`);
        break;
      }
      // continue trying next fallback
      await sleep(300);
    }
  }

  const combined = errors.map(e => `${e.model}: ${e.error?.message || e.error}`).join(' | ');
  console.error('[tryGenerateWithFallbacks] All models failed:', combined);
  throw new Error(`All model attempts failed. Errors: ${combined}`);
};

export const generateLearningPath = async (topic) => {
  if (!topic || typeof topic !== "string") {
    throw new Error("Invalid topic provided");
  }

  try {
  const prompt = `Generate a comprehensive learning path for: "${topic}"
    Requirements:
    - Create exactly 5 progressive modules
    - Each module should build upon previous knowledge
    - Focus on practical, hands-on learning
    - Include both theoretical and practical aspects
    
    Return ONLY a JSON array with exactly 5 strings in this format:
    ["Module 1: [Clear Title]", "Module 2: [Clear Title]", "Module 3: [Clear Title]", "Module 4: [Clear Title]", "Module 5: [Clear Title]"]
    `;
  // Request base64-only payload for robustness in the browser
  const base64Prompt = prompt + "\n\nFinally, base64-encode the JSON array and RETURN ONLY the raw base64 string (no JSON, no markdown, no extra text).";

  const result = await tryGenerateWithFallbacks(base64Prompt);
  const text = result.response?.text ? result.response.text() : String(result);

  try {
    // Attempt to decode base64 payload
    const decoded = decodeBase64Payload(text);
    if (!Array.isArray(decoded) || decoded.length !== 5) {
      throw new Error('Invalid decoded learning path format');
    }
    return decoded;
  } catch (error) {
    console.error('Parsing error (base64 decode):', error);
    // Fallback: try previous sanitization and parsing
    try {
      const cleanText = sanitizeJSON(text);
      const modules = JSON.parse(cleanText);
      if (!Array.isArray(modules) || modules.length !== 5) throw new Error('Invalid response format');
      return modules;
    } catch (err) {
      console.error('Parsing error fallback:', err);
      return [
        `Module 1: Introduction to ${topic}`,
        `Module 2: Core Concepts of ${topic}`,
        `Module 3: Intermediate ${topic} Techniques`,
        `Module 4: Advanced ${topic} Applications`,
        `Module 5: Real-world ${topic} Projects`,
      ];
    }
  }
  } catch (error) {
    throw new Error(`Failed to generate learning path: ${error.message}`);
  }
};

const isCodeRelatedTopic = (topic) => {
  const techKeywords = {
    programming: ['javascript', 'python', 'java', 'coding', 'programming', 'typescript'],
    web: ['html', 'css', 'react', 'angular', 'vue', 'frontend', 'backend', 'fullstack'],
    database: ['sql', 'database', 'mongodb', 'postgres'],
    software: ['api', 'development', 'software', 'git', 'devops', 'algorithms'],
    tech: ['computer science', 'data structures', 'networking', 'cloud']
  };

  const lowerTopic = topic.toLowerCase();
  return Object.values(techKeywords).some(category => 
    category.some(keyword => lowerTopic.includes(keyword))
  );
};

export const generateModuleContent = async (moduleName, options = { detailed: false }) => {
  if (!moduleName || typeof moduleName !== "string") {
    throw new Error("Invalid module name provided");
  }

  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[generateModuleContent] Attempt ${attempt}/${MAX_RETRIES} for: ${moduleName}`);
      
      // use fallback helper to pick an available model
      // options can be extended if needed in future
      const isTechTopic = isCodeRelatedTopic(moduleName);

  let prompt = `Create educational content for: "${moduleName}"
      Type: ${isTechTopic ? 'Technical/Programming' : 'General'}
      Level: ${options.detailed ? 'Advanced' : 'Basic'}

      ${isTechTopic ? `Important: EVERY section must include:
      - Practical code examples with explanations
      - Working code snippets that demonstrate concepts
      - Best practices and common patterns
      - Error handling where relevant` : ''}

      Return a JSON object strictly following this structure:
      {
        "title": "${moduleName}",
        "type": "${isTechTopic ? 'technical' : 'general'}",
        "sections": [
          {
            "title": "Section Title",
            "content": "Detailed explanation",
            "keyPoints": ["Key point 1", "Key point 2"],
            ${isTechTopic ? `"codeExample": {
              "language": "${getAppropriateLanguage(moduleName)}",
              "code": "// Include working code here\\nfunction example() {\\n  // code implementation\\n}",
              "explanation": "Explain how the code works"
            }` : '"codeExample": null'}
          }
        ]
      }`;
  // IMPORTANT: To avoid JSON-escaping/parsing issues when the model emits
  // HTML or code snippets, BASE64-ENCODE the required JSON object and
  // RETURN ONLY the raw base64 string (no JSON wrapper, no markdown fences,
  // no surrounding text). Example response body should be exactly:
  // eyJ0aXRsZSI6Ik1vZHVsZSIsInNlY3Rpb25zIjpbXX0=
  // Do NOT include backticks, code fences, or any other characters.
  prompt += "\n\nFinally, base64-encode the JSON object and RETURN ONLY the raw base64 string (no JSON, no markdown, no extra text). Example: eyJ0aXRsZSI6...";

      const result = await tryGenerateWithFallbacks(prompt);
      let text = result.response?.text ? result.response.text() : String(result);
      
      console.log(`[generateModuleContent] Got response, length: ${text.length}, type: ${typeof text}`);
      
      // Ensure we have a clean string (not a String object)
      text = String(text);
      
      // Enhanced JSON cleaning and parsing
      text = sanitizeJSON(text);

      // Remove fenced code blocks (```...```) which often wrap JSON or base64
      try {
        text = text.replace(/```(?:json)?\s*[\s\S]*?```/g, (m) => {
          // strip fences but keep inner content
          return m.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '');
        }).trim();
      } catch (e) {
        // ignore
      }

      // If the model returned a b64 property anywhere (even inside extra text), try to extract and decode it
      const b64Match = text.match(/"b64"\s*:\s*"([A-Za-z0-9+/=]+)"/);
      const rawB64Match = text.match(/^\s*([A-Za-z0-9+/=]{20,})\s*$/m);
      const tryDecodeBase64 = (b64str) => {
        try {
          let decoded;
          if (typeof atob === 'function') {
            decoded = atob(b64str);
          } else if (typeof Buffer !== 'undefined') {
            decoded = Buffer.from(b64str, 'base64').toString('utf8');
          } else {
            throw new Error('No base64 decoder available');
          }
          return JSON.parse(decoded);
        } catch (e) {
          return null;
        }
      };

      // Also try to extract pure JSON inside triple backticks if present
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1].trim();
      }

      // If the model returned a raw base64 string (no JSON), decode it.
      if (!content) {
        const raw = rawB64Match ? rawB64Match[1] : null;
        if (raw) {
          const decoded = tryDecodeBase64(raw);
          if (decoded) content = decoded;
        }
      }

      let content = null;
      // 1) Try direct parse
      try {
        content = JSON.parse(text);
      } catch (e1) {
        // 2) Try base64 decode if found
        if (b64Match && b64Match[1]) {
          const decoded = tryDecodeBase64(b64Match[1]);
          if (decoded) content = decoded;
        }
      }

      // 3) Last resort: normalize whitespace and try parse
      if (!content) {
        try {
          const normalized = text.replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '').replace(/\t/g, '');
          content = JSON.parse(normalized);
          console.log('[generateModuleContent] Parsed after normalization');
        } catch (finalError) {
          console.error('[generateModuleContent] Final parse attempt failed:', finalError.message);
          // Provide debug snippets
          console.log('[generateModuleContent] Problematic JSON (first 500 chars):', text.substring(0, 500));
          console.log('[generateModuleContent] Around error position (chars 2400-2600):', text.substring(2400, 2600));
          throw finalError;
        }
      }

      if (!validateModuleContent(content)) {
        console.warn('[generateModuleContent] Invalid content structure:', content);
        throw new Error('Invalid content structure');
      }

      // Process and clean content
      content.sections = content.sections.map(section => ({
        ...section,
        content: sanitizeContent(section.content),
        codeExample: section.codeExample ? cleanCodeExample(section.codeExample) : null
      }));

      console.log(`[generateModuleContent] Success! Sections: ${content.sections.length}`);
      return content;
    } catch (error) {
      console.error(`[generateModuleContent] Attempt ${attempt} failed:`, error.message);
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.error('[generateModuleContent] All attempts failed:', lastError);
  throw lastError || new Error('Failed to generate content');
};

// Add helper function to determine appropriate language
const getAppropriateLanguage = (topic) => {
  const topicLower = topic.toLowerCase();
  const languageMap = {
    javascript: ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
    python: ['python', 'django', 'flask'],
    java: ['java', 'spring'],
    html: ['html', 'markup'],
    css: ['css', 'styling', 'scss'],
    sql: ['sql', 'database', 'mysql', 'postgresql'],
    typescript: ['typescript', 'ts'],
  };

  for (const [lang, keywords] of Object.entries(languageMap)) {
    if (keywords.some(keyword => topicLower.includes(keyword))) {
      return lang;
    }
  }
  return 'javascript'; // default language
};

export const generateFlashcards = async (topic, numCards = 5) => {
  if (!topic || typeof topic !== "string") {
    throw new Error("Invalid topic provided");
  }

  try {
  const prompt = `Generate ${numCards} educational flashcards on "${topic}" with increasing difficulty.
    
    **Requirements:**
    - The **front side (question)** must be **short and clear**.
    - The **back side (answer)** must be **detailed (3-4 sentences) and informative**.
    - Ensure **difficulty increases from Flashcard 1 to ${numCards}**:
      - Start with **basic concepts**.
      - Progress to **intermediate details**.
      - End with **advanced questions requiring deeper understanding**.
    - Format the response **strictly** as a JSON array:

    [
      { "id": 1, "frontHTML": "Basic question?", "backHTML": "Detailed easy explanation." },
      { "id": 2, "frontHTML": "Intermediate question?", "backHTML": "Detailed intermediate explanation." },
      { "id": ${numCards}, "frontHTML": "Advanced question?", "backHTML": "Detailed advanced explanation." }
    ]`;

  // Request base64-only payload for browser robustness
  const base64Prompt = prompt + "\n\nFinally, base64-encode the JSON array and RETURN ONLY the raw base64 string (no JSON, no markdown, no extra text).";
  const result = await tryGenerateWithFallbacks(base64Prompt);
  const text = result.response?.text ? result.response.text() : String(result);

  try {
    const decoded = decodeBase64Payload(text);
    if (!Array.isArray(decoded) || decoded.length !== numCards) {
      throw new Error('Invalid decoded flashcard format');
    }
    return decoded;
  } catch (error) {
    console.error('Flashcard parsing error (base64):', error);
    // Fallback to previous behavior
    try {
      const cleanText = sanitizeJSON(text);
      const flashcards = JSON.parse(cleanText);
      if (!Array.isArray(flashcards) || flashcards.length !== numCards) throw new Error('Invalid flashcard format');
      return flashcards;
    } catch (err) {
      console.error('Flashcard parsing error fallback:', err);
      return Array.from({ length: numCards }, (_, i) => ({
        id: i + 1,
        frontHTML: `Basic to advanced ${topic} question ${i + 1}?`,
        backHTML: `Detailed answer explaining ${topic} at difficulty level ${i + 1}.`,
      }));
    }
  }
  } catch (error) {
    throw new Error(`Failed to generate flashcards: ${error.message}`);
  }
};

export const generateQuizData = async (topic, numQuestions = 5) => {
  if (!topic || typeof topic !== "string") {
    throw new Error("Invalid topic provided");
  }

  try {
  const prompt = `Generate a quiz on "${topic}" with ${numQuestions} questions.
    
    **Requirements:**
    - Each question should be **clear and well-structured**.
    - Include **single-choice and multiple-choice** questions randomly.
    - Provide **4 answer options** for each question.
    - Clearly indicate the **correct answer(s)**.
    - Give a **short explanation** for the correct answer.
    - Assign **points (default: 10 per question)**.
    - Format the response as a **JSON array**:

    [
      {
        "question": "Example question?",
        "questionType": "single",
        "answers": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "Short explanation here.",
        "point": 10
      },
      {
        "question": "Another example?",
        "questionType": "multiple",
        "answers": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": ["Option B", "Option C"],
        "explanation": "Short explanation here.",
        "point": 10
      }
    ]`;

  const base64Prompt = prompt + "\n\nFinally, base64-encode the JSON array and RETURN ONLY the raw base64 string (no JSON, no markdown, no extra text).";
  const result = await tryGenerateWithFallbacks(base64Prompt);
  const text = result.response?.text ? result.response.text() : String(result);

  try {
    const decoded = decodeBase64Payload(text);
    if (!Array.isArray(decoded) || decoded.length !== numQuestions) throw new Error('Invalid decoded quiz format');
    return { nrOfQuestions: numQuestions.toString(), questions: decoded };
  } catch (error) {
    console.error('Quiz parsing error (base64):', error);
    try {
      const cleanText = sanitizeJSON(text);
      const quizData = JSON.parse(cleanText);
      if (!Array.isArray(quizData) || quizData.length !== numQuestions) throw new Error('Invalid quiz format');
      return { nrOfQuestions: numQuestions.toString(), questions: quizData };
    } catch (err) {
      console.error('Quiz parsing error fallback:', err);
      return { nrOfQuestions: "0", questions: [] };
    }
  }
  } catch (error) {
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

export const generateChatResponse = async (message, context) => {
  try {
    // Create context-aware prompt
    const contextPrompt = `
      Context:
      Topic: ${context['What topic would you like to discuss today?'] || 'General'}
      Level: ${context["What's your current knowledge level in this topic? (Beginner/Intermediate/Advanced)"] || 'Intermediate'}
      Focus: ${context['What specific aspects would you like to focus on?'] || 'General understanding'}
      
      Be concise and helpful. Answer the following: ${message}
    `;

    const result = await tryGenerateWithFallbacks(contextPrompt);
    return result.response?.text ? result.response.text() : String(result);
  } catch (error) {
    console.error('Chat generation error:', error);
    throw new Error('Failed to generate response');
  }
};
