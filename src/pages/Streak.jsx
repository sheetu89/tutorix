import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format, differenceInDays, parseISO } from "date-fns";
import { RiFireFill } from "react-icons/ri";

const QuizStreak = ({ quizScores }) => {
  const [quizDates, setQuizDates] = useState(new Set());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    if (quizScores.length > 0) {
      // Extract & format quiz dates
      const dates = quizScores.map((q) =>
        format(parseISO(q.date), "yyyy-MM-dd")
      );
      setQuizDates(new Set(dates));

      // Calculate streaks
      calculateStreaks(dates);
    }
  }, [quizScores]);

  const calculateStreaks = (dates) => {
    if (dates.length === 0) return;

    // Sort dates & remove duplicates
    const sortedDates = [...new Set(dates)].sort();

    let tempStreak = 1,
      maxStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const diff = differenceInDays(
        parseISO(sortedDates[i]),
        parseISO(sortedDates[i - 1])
      );

      if (diff === 1) {
        tempStreak++; // Increase streak if consecutive
      } else if (diff > 1) {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1; // Reset streak if there's a gap
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Calculate current streak
    const today = format(new Date(), "yyyy-MM-dd");
    const lastQuizDate = sortedDates[sortedDates.length - 1];
    const daysSinceLastQuiz = differenceInDays(
      parseISO(today),
      parseISO(lastQuizDate)
    );

    setCurrentStreak(daysSinceLastQuiz <= 1 ? tempStreak : 0);
    setLongestStreak(maxStreak);
  };

  return (
    <div className="bg-gray-100 p-2 md:p-6 rounded-lg shadow-lg md:w-xl mt-5 md:mt-12">
      <h2 className="text-2xl font-semibold text-purple-700 mb-4 text-center">
        Quiz Streak 🔥
      </h2>

      {/* Streak Display */}
      <div className="flex flex-col justify-between md:text-lg md:font-medium mb-4">
        <span>
          🔥 Current Streak:{" "}
          <span className="text-purple-600">{currentStreak} Days</span>
        </span>
        <span>
          🏆 Longest Streak:{" "}
          <span className="text-purple-600">{longestStreak} Days</span>
        </span>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <div className="w-64  md:w-fit p-1 text-sm md:text-xl">
          <Calendar
            className=""
            tileClassName={({ date }) => {
              const formattedDate = format(date, "yyyy-MM-dd");
              return quizDates.has(formattedDate)
                ? "relative rounded-md z-10"
                : "";
            }}
            tileContent={({ date }) => {
              const formattedDate = format(date, "yyyy-MM-dd");
              return quizDates.has(formattedDate) ? (
                <div className="absolute inset-0 flex justify-center items-center">
                  <RiFireFill className="text-lg sm:text-sm md:text-2xl opacity-70 text-amber-500" />
                </div>
              ) : null;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuizStreak;
