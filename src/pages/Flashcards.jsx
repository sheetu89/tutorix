import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateFlashcards } from "../config/gemini";
import { updateUserProgress } from "../config/database";
import { useAuth } from "../context/AuthContext";

const CustomCard = ({ card, isFlipped, onClick }) => (
  <div className="relative w-full h-[400px] cursor-pointer" onClick={onClick}>
    <motion.div
      className="absolute w-full h-full"
      initial={false}
      animate={{ rotateX: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
    >
      {/* Front of card */}
      <div
        className={`absolute w-full h-full bg-white rounded-2xl p-8 shadow-xl 
          ${isFlipped ? "backface-hidden" : ""} flex flex-col justify-between`}
      >
        <div className="text-sm text-purple-500 font-semibold">
          Question {card.id}
        </div>
        <div className="text-2xl font-medium text-center">{card.frontHTML}</div>
        <div className="text-sm text-gray-400 text-center">Click to flip ↓</div>
      </div>

      {/* Back of card */}
      <div
        className={`absolute w-full h-full bg-purple-50 rounded-2xl p-8 shadow-xl
          ${!isFlipped ? "backface-hidden" : ""} flex flex-col justify-between`}
        style={{ transform: "rotateX(180deg)" }}
      >
        <div className="text-sm text-purple-500 font-semibold">Answer</div>
        <div className="text-base md:text-lg text-center">{card.backHTML}</div>
        <div className="text-sm text-gray-400 text-center">Click to flip ↑</div>
      </div>
    </motion.div>
  </div>
);

const Flashcards = () => {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchFlashcards = async () => {
    if (!topic.trim() || numCards < 1) {
      return alert("Please enter a valid topic and number of flashcards!");
    }

    setLoading(true);
    setError(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    try {
      const generatedCards = await generateFlashcards(topic, numCards);
      setCards(generatedCards);

      if (user?.$id) {
        await updateUserProgress(user.$id, {
          topicName: topic,
          flashcardCount: generatedCards.length, // Update with actual number of cards
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load flashcards. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  return (
    <motion.div
      className="flex flex-col rounded-2xl items-center min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full max-w-4xl"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">
          Interactive Flashcards
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Generate AI-powered flashcards for any topic
        </p>

        {/* Enhanced Input Section */}
        <motion.div
          className="bg-white p-6 rounded-2xl shadow-lg mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., JavaScript Basics, World History"
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cards
              </label>
              <input
                type="number"
                value={numCards}
                onChange={(e) =>
                  setNumCards(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-end">
              <motion.button
                onClick={fetchFlashcards}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Cards"
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Status Messages */}
        {error && (
          <motion.div
            className="bg-red-50 text-red-600 p-4 rounded-xl mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* Flashcards Display */}
        {cards.length > 0 && !loading && (
          <motion.div
            className="w-full flex flex-col items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-full max-w-2xl mx-auto">
              <div className="relative flex flex-col items-center">
                <CustomCard
                  card={cards[currentCardIndex]}
                  isFlipped={isFlipped}
                  onClick={() => setIsFlipped(!isFlipped)}
                />

                {/* Navigation Controls */}
                <div className="flex justify-between items-center w-full mt-8 px-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrev}
                    disabled={currentCardIndex === 0}
                    className="px-6 py-3 bg-purple-100 text-purple-600 rounded-xl disabled:opacity-50 
                      hover:bg-purple-200 transition-colors"
                  >
                    Previous
                  </motion.button>
                  <div className="text-purple-600 font-medium bg-purple-50 px-4 py-2 rounded-lg">
                    {currentCardIndex + 1} / {cards.length}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    disabled={currentCardIndex === cards.length - 1}
                    className="px-6 py-3 bg-purple-100 text-purple-600 rounded-xl disabled:opacity-50 
                      hover:bg-purple-200 transition-colors"
                  >
                    Next
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Flashcards;
