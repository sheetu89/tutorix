import 'dotenv/config';
import axios from 'axios';

const APPWRITE_ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;

const collections = {
  userProgress: "user_progress",
  learningPaths: "learning_paths",
};

// Function to check if an attribute exists
async function checkAttributeExists(collectionId, attributeKey) {
  try {
    const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}`;

    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
    });

    if (response.data && response.data.attributes) {
      return response.data.attributes.some((attr) => attr.key === attributeKey);
    }

    return false;
  } catch (error) {
    console.log(`Error checking if attribute ${attributeKey} exists: ${error.message}`);
    return false;
  }
}

// Function to create attribute using Appwrite REST API
async function createAttributeViaAPI(collectionId, attributeType, attributeKey, options = {}) {
  try {
    const attributeExists = await checkAttributeExists(collectionId, attributeKey);

    if (attributeExists) {
      console.log(`✅ Attribute ${attributeKey} already exists in ${collectionId} collection, skipping`);
      return null;
    }

    const url = `${APPWRITE_ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${attributeType}`;

    const payload = {
      key: attributeKey,
      required: options.required || false,
      ...options,
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': APPWRITE_API_KEY,
      },
    });

    console.log(`✅ Created ${attributeKey} attribute in ${collectionId} collection`);
    return response.data;
  } catch (error) {
    console.log(`⚠️ Error creating ${attributeKey} attribute: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function createAttributes() {
  try {
    // USER PROGRESS Collection Attributes
    console.log("Creating attributes for user_progress collection...");
    await createAttributeViaAPI(collections.userProgress, "string", "userID", { size: 255, required: true });
    await createAttributeViaAPI(collections.userProgress, "string", "topicName", { size: 255, required: false });
    await createAttributeViaAPI(collections.userProgress, "string", "quizScores", { size: 5000, required: false });
    await createAttributeViaAPI(collections.userProgress, "integer", "flashcardCount", { required: false });

    // LEARNING PATHS Collection Attributes
    console.log("Creating attributes for learning_paths collection...");
    await createAttributeViaAPI(collections.learningPaths, "string", "userID", { size: 255, required: true });
    await createAttributeViaAPI(collections.learningPaths, "string", "topicName", { size: 255, required: true });
    await createAttributeViaAPI(collections.learningPaths, "string", "modules", { size: 5000, required: true });
    await createAttributeViaAPI(collections.learningPaths, "integer", "progress", { required: true });
    await createAttributeViaAPI(collections.learningPaths, "string", "completedModules", { size: 5000, required: false });

    console.log("✅ Attributes creation process completed.");
  } catch (error) {
    console.error("❌ Failed to create attributes:", error.message);
  }
}

createAttributes();