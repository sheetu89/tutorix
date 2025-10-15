import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { account } from "../config/appwrite";
import { generateLearningPath } from "../config/gemini";
import {
  createLearningPath,
  getLearningPaths,
  deleteLearningPath,
} from "../config/database";
import { useNavigate } from "react-router-dom";

const LearningPath = () => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [topicName, setTopicName] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const topicSuggestions = [
    { name: "JavaScript Fundamentals", icon: "⚡" },
    { name: "React Basics", icon: "⚛️" },
    { name: "Python for Beginners", icon: "🐍" },
    { name: "Web Development", icon: "🌐" },
    { name: "Data Structures", icon: "🏗️" },
  ];

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const user = await account.get();
      const response = await getLearningPaths(user.$id);
      setPaths(response.documents);
    } catch (error) {
      console.error("Error fetching paths:", error);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const user = await account.get();
      console.debug("LearningPath: authenticated user:", user);
      if (!user || !user.$id) {
        setError("User not authenticated. Please login before creating a learning path.");
        setLoading(false);
        return;
      }
      const modules = await generateLearningPath(topicName);

      if (!Array.isArray(modules) || modules.length === 0) {
        throw new Error("Invalid response from AI");
      }

      console.debug("LearningPath: creating path for userId", user.$id, { topicName, modules });
      await createLearningPath(user.$id, topicName, modules);
      setShowModal(false);
      fetchPaths();
      // Show success message
    } catch (error) {
      console.error("Error creating path:", error);
      // Surface detailed error during debugging — includes Appwrite error object
      setError(error.message || (error && error.response ? JSON.stringify(error.response) : JSON.stringify(error)) || "Failed to create learning path");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, pathId) => {
    e.stopPropagation(); // Prevent navigation when clicking delete
    try {
      await deleteLearningPath(pathId);
      await fetchPaths(); // Refresh the list
    } catch (error) {
      setError("Failed to delete learning path");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <motion.div
        className="max-w-6xl mx-auto space-y-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header Section */}
        <motion.div
          variants={item}
          className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-purple-100/30"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Learning Paths
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage your personalized learning journeys
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/20 transition-shadow flex items-center gap-2 group"
            >
              <span>Create New Path</span>
              <motion.span
                className="inline-block"
                initial={{ x: 0 }}
                animate={{ x: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                →
              </motion.span>
            </motion.button>
          </div>
        </motion.div>

        {/* Learning Paths Grid */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {paths.map((path, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-purple-100/30 shadow-lg hover:shadow-xl cursor-pointer relative group"
              onClick={() => navigate(`/learning-path/${path.$id}`)}
            >
              <motion.button
                className="absolute top-4 right-4 p-2 bg-red-100/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                onClick={(e) => handleDelete(e, path.$id)}
                whileHover={{
                  scale: 1.1,
                  backgroundColor: "rgba(254, 226, 226, 0.9)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </motion.button>

              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                {path.topicName}
              </h2>

              <div className="space-y-4">
                <div className="w-full bg-purple-100 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full"
                    style={{ width: `${path.progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${path.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-gray-600 font-medium">
                    {path.progress}% Complete
                  </p>
                  <span className="text-purple-600">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced Create Path Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl w-full max-w-lg shadow-2xl border border-purple-100/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Create Your Learning Journey
                    </h2>
                    <p className="text-gray-600">
                      Enter a topic or select from suggestions to start learning
                    </p>
                  </div>

                  {/* Topic Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Topic Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g., JavaScript Fundamentals"
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-purple-100 focus:border-purple-300 focus:ring-2 focus:ring-purple-200 outline-none transition-all pl-10"
                      />
                      <span className="absolute left-3 top-3 text-gray-400">
                        🎯
                      </span>
                    </div>
                  </div>

                  {/* Topic Suggestions */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Popular Topics
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {topicSuggestions.map((topic, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setTopicName(topic.name)}
                          className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                            topicName === topic.name
                              ? "bg-purple-100 text-purple-700"
                              : "hover:bg-purple-50 text-gray-600"
                          }`}
                        >
                          <span>{topic.icon}</span>
                          <span className="text-sm">{topic.name}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowModal(false)}
                      className="px-6 py-2.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreate}
                      disabled={!topicName.trim() || loading}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50 text-sm font-medium"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                          <span>Generating Path...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Create Path</span>
                          <span>→</span>
                        </div>
                      )}
                    </motion.button>
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 text-sm text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LearningPath;
