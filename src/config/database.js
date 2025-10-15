import { Client, Databases, Query, ID, Permission, Role } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const databases = new Databases(client);

// Collection IDs from environment (ensure these are the actual Appwrite collection IDs, not friendly names)
const LEARNING_PATH_COLLECTION = import.meta.env.VITE_COLLECTION_ID;
const USER_PROGRESS_COLLECTION = import.meta.env.VITE_USER_PROGRESS_COLLECTION_ID || "user_progress";

// Basic runtime validation to help debugging misconfigured env values
if (!import.meta.env.VITE_APPWRITE_DATABASE_ID || !import.meta.env.VITE_APPWRITE_PROJECT_ID) {
  console.warn("Appwrite config warning: VITE_APPWRITE_DATABASE_ID or VITE_APPWRITE_PROJECT_ID may be missing in your .env");
}
if (!LEARNING_PATH_COLLECTION) {
  console.warn("Appwrite config warning: VITE_COLLECTION_ID (learning paths collection) is not set. Make sure to set it to the collection ID, not the collection name.");
}

export const createLearningPath = async (userId, topicName, modules) => {
  try {
    // Create the document and set per-user read/write permissions so the
    // authenticated user becomes the owner. Use the SDK helpers to form
    // valid Permission/Role objects instead of raw strings.
    return await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_COLLECTION_ID,
      ID.unique(),
      {
        userID: userId,
        topicName,
        modules: JSON.stringify(modules), // Convert array to string
        progress: 0,
        completedModules: JSON.stringify([]), // Initialize as empty array
      },
      [Permission.read(Role.user(userId)), Permission.write(Role.user(userId))]
    );
  } catch (error) {
    // Log detailed Appwrite error payload when available to help debugging in browser
    console.error("Database Error:", error);
    try {
      console.error("Appwrite error details:", JSON.stringify({ message: error.message, code: error.code, response: error.response || error.responseJSON || null }));
    } catch (e) {
      // ignore
    }
    // Rethrow the original error so the caller can see Appwrite's detailed message
    throw error;
  }
};

export const getLearningPaths = async (userId) => {
  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      LEARNING_PATH_COLLECTION,
      [Query.equal("userID", userId)]
    );

    // Parse modules string back to array for each document
    return {
      ...response,
      documents: response.documents.map((doc) => ({
        ...doc,
        modules: JSON.parse(doc.modules),
        completedModules: JSON.parse(doc.completedModules || '[]'), // Parse completedModules
      })),
    };
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to fetch learning paths");
  }
};

export const updateLearningPathProgress = async (pathId, progress) => {
  try {
    return await databases.updateDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_COLLECTION_ID,
      pathId,
      {
        progress: Math.min(progress, 100), // Ensure progress doesn't exceed 100
      }
    );
  } catch (error) {
    console.error("Progress update error:", error);
    throw new Error("Failed to update progress");
  }
};

export const deleteLearningPath = async (pathId) => {
  try {
    await databases.deleteDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_COLLECTION_ID,
      pathId
    );
  } catch (error) {
    console.error("Delete error:", error);
    throw new Error("Failed to delete learning path");
  }
};

export const updateUserProgress = async (userId, data) => {
  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      USER_PROGRESS_COLLECTION,
      [Query.equal("userID", userId)]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        USER_PROGRESS_COLLECTION,
        doc.$id,
        {
          userID: userId,
          topicName: data.topicName || doc.topicName,
          quizScores: data.quizScores
            ? JSON.stringify([
                ...JSON.parse(doc.quizScores || "[]"),
                data.quizScores,
              ])
            : doc.quizScores,
          flashcardCount: data.flashcardCount
            ? parseInt(doc.flashcardCount || 0) + data.flashcardCount
            : doc.flashcardCount,
        }
      );
    }

    // No existing doc — create one with document-level permissions
    return await databases.createDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      USER_PROGRESS_COLLECTION,
      ID.unique(),
      {
        userID: userId,
        topicName: data.topicName || "",
        quizScores: data.quizScores ? JSON.stringify([data.quizScores]) : "[]",
        flashcardCount: data.flashcardCount || 0,
      }
    );
  } catch (error) {
    console.error("Progress update error:", error);
    try {
      console.error("Appwrite error details:", JSON.stringify({ message: error.message, code: error.code, response: error.response || error.responseJSON || null }));
    } catch (e) {}
    throw error;
  }
};

export const getFlashcardCount = async (userId) => {
  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      USER_PROGRESS_COLLECTION,
      [Query.equal("userID", userId)]
    );

    if (response.documents.length > 0) {
      return response.documents[0].flashcardCount || 0; // Return count or default to 0
    } else {
      return 0; // Default if no user progress is found
    }
  } catch (error) {
    console.error("Error fetching flashcard count:", error);
    return 0;
  }
};

export const getUserProgress = async (userId) => {
  try {
    const response = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      USER_PROGRESS_COLLECTION,
      [Query.equal("userID", userId)]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      return {
        flashcardCount: doc.flashcardCount || 0,
        quizScores: doc.quizScores ? JSON.parse(doc.quizScores) : [], // Parse JSON string
      };
    } else {
      return {
        flashcardCount: 0,
        quizScores: [],
      };
    }
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return { flashcardCount: 0, quizScores: [] };
  }
};

export const markModuleComplete = async (pathId, moduleIndex) => {
  try {
    const doc = await databases.getDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_COLLECTION_ID,
      pathId
    );

    const completedModules = JSON.parse(doc.completedModules || '[]');
    if (!completedModules.includes(moduleIndex)) {
      completedModules.push(moduleIndex);
    }

    return await databases.updateDocument(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_COLLECTION_ID,
      pathId,
      {
        completedModules: JSON.stringify(completedModules),
        progress: Math.round((completedModules.length / JSON.parse(doc.modules).length) * 100)
      }
    );
  } catch (error) {
    console.error('Module completion update error:', error);
    throw error;
  }
};
