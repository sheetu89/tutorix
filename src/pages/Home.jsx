import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  RiRocketLine,
  RiBrainLine,
  RiBarChartBoxLine,
  RiArrowRightLine,
  RiPlayCircleLine
} from "react-icons/ri";

const Home = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]); // Reduced movement distance
  const [expandedFaq, setExpandedFaq] = useState(null);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 } // Reduced stagger time
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 }, // Reduced movement
    show: { opacity: 1, y: 0 }
  };

  const features = [
    {
      icon: <RiRocketLine className="text-5xl text-purple-600" />,
      title: "AI-Powered Learning",
      description: "Experience personalized learning paths crafted by advanced AI algorithms",
      gradient: "from-purple-500/20 to-indigo-500/20"
    },
    {
      icon: <RiBrainLine className="text-5xl text-purple-600" />,
      title: "Smart Integration",
      description: "Seamlessly connect with modern learning tools and platforms",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <RiBarChartBoxLine className="text-5xl text-purple-600" />,
      title: "Progress Tracking",
      description: "Monitor your growth with detailed analytics and insights",
      gradient: "from-indigo-500/20 to-purple-500/20"
    }
  ];

  const faqItems = [
    {
      question: "How does AI enhance my learning?",
      answer: "Our AI analyzes your learning style, pace, and performance to create personalized study paths and recommendations, ensuring optimal learning outcomes."
    },
    {
      question: "Is this platform suitable for beginners?",
      answer: "Absolutely! Our AI adapts to all skill levels, providing appropriate content and pacing whether you're a beginner or advanced learner."
    },
    {
      question: "What types of content are available?",
      answer: "We offer interactive quizzes, video lessons, practice exercises, flashcards, and real-world projects across various topics and disciplines."
    },
    {
      question: "How do you track progress?",
      answer: "Our platform provides detailed analytics, progress tracking, performance metrics, and personalized feedback to help you monitor your learning journey."
    },
    {
      question: "Can I learn at my own pace?",
      answer: "Yes! The platform is designed for self-paced learning, allowing you to study when and where it's convenient for you."
    },
    {
      question: "What makes your AI different?",
      answer: "Our AI uses advanced algorithms to understand your learning patterns, struggles, and strengths, creating truly personalized learning experiences."
    }
  ];

  const stats = [
    {
      number: "10K+",
      label: "Active Users",
      icon: "👥",
      gradient: "from-purple-500/20 to-indigo-500/20"
    },
    {
      number: "50+",
      label: "Learning Topics",
      icon: "📚",
      gradient: "from-indigo-500/20 to-purple-500/20"
    },
    {
      number: "95%",
      label: "Success Rate",
      icon: "🎯",
      gradient: "from-purple-500/20 to-pink-500/20"
    }
  ];

  const BadgeComponent = () => (
    <motion.div variants={item} className="inline-block relative">
      <span
        className="relative inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-purple-100/80 to-indigo-100/80 backdrop-blur border border-purple-100 rounded-full text-sm font-medium text-purple-600 shadow-lg hover:shadow-purple-500/20 transition-all group"
      >
        <span className="mr-2">🎓</span>
        <span className="relative bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          AI-Powered Learning Platform
        </span>
      </span>
    </motion.div>
  );

  const HeroSection = () => (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="text-center space-y-12 relative py-4 md:py-10"
    >
      {/* Decorative elements */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-purple-400/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -right-20 w-60 h-60 bg-indigo-400/10 rounded-full blur-3xl -z-10" />

      {/* Enhanced Badge */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-indigo-600/5 to-purple-600/5 rounded-full blur-lg"
        />
        <BadgeComponent />
      </div>

      {/* Enhanced Title */}
      <div className="relative">
        <motion.h1
          variants={item}
          className="text-6xl md:text-8xl font-bold tracking-tight leading-tight"
        >
          <span className="relative inline-block">
            <span className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 blur-2xl" />
            <span className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Transform Your Learning
            </span>
          </span>
          <span className="block mt-4 text-4xl md:text-5xl text-gray-800">
            With AI-Powered Education
          </span>
        </motion.h1>
      </div>

      {/* Enhanced paragraph with subtle animation */}
      <motion.p
        variants={item}
        className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed"
      >
        Experience personalized learning paths and interactive content tailored to your learning style, pace, and goals. Unlock your full potential with our intelligent platform.
      </motion.p>

      {/* CTA with enhanced visual treatment */}
      <motion.div
        variants={item}
        className="relative"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-indigo-600/10 to-purple-600/5 rounded-3xl blur-xl"
        />
        <div className="relative py-4">
          <CallToActionButtons />
        </div>
      </motion.div>

      {/* Stats ribbon above CTA */}
      <motion.div
        variants={item}
        className="flex flex-wrap justify-center gap-8 py-4"
      >
        {[
          { value: "10,000+", label: "Active Learners" },
          { value: "95%", label: "Success Rate" },
          { value: "24/7", label: "AI Support" }
        ].map((stat, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {stat.value}
            </span>
            <span className="text-sm text-gray-500">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );

  const CallToActionButtons = () => (
    <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => navigate("/dashboard")}
        className="group px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-medium shadow-xl flex items-center gap-3 text-lg transition-all duration-300"
      >
        Start Learning
        <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        className="px-10 py-5 bg-white/80 backdrop-blur border border-purple-100 text-purple-600 rounded-2xl font-medium flex items-center gap-3 text-lg shadow-lg"
      >
        <RiPlayCircleLine className="text-2xl" />
        Watch Demo
      </motion.button>
    </motion.div>
  );

  const TrustBadgesSection = () => (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mt-20 flex justify-center gap-8 grayscale opacity-50"
    >
      {/* Add tech partner logos here */}
    </motion.div>
  );

  const FeaturesSection = () => (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8"
    >
      {features.map((feature, index) => (
        <FeatureCard key={index} feature={feature} />
      ))}
    </motion.div>
  );

  const FeatureCard = ({ feature }) => (
    <div
      className={`group p-8 bg-white/70 backdrop-blur-sm rounded-3xl border border-purple-100/30 
        shadow-lg hover:shadow-xl transition-all duration-300 
        bg-gradient-to-br ${feature.gradient}`}
    >
      <div className="bg-white/80 rounded-2xl p-4 w-fit group-hover:scale-105 transition-transform duration-300">
        {feature.icon}
      </div>
      <h3 className="text-2xl font-semibold mt-6 text-gray-900">{feature.title}</h3>
      <p className="mt-4 text-gray-600 leading-relaxed">{feature.description}</p>
    </div>
  );

  const FaqSection = () => (
    <div className="mt-32">
      <h2
        className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
      >
        Frequently Asked Questions
      </h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/30 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
          >
            <div
              className={`p-6 ${expandedFaq === index ? 'bg-purple-50/50' : ''}`}
              onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="text-purple-600 text-xl transition-transform duration-300"
                    style={{ transform: expandedFaq === index ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    {expandedFaq === index ? '−' : '+'}
                  </span>
                  <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                    {item.question}
                  </h3>
                </div>
              </div>
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: expandedFaq === index ? '500px' : '0',
                  opacity: expandedFaq === index ? 1 : 0,
                  marginTop: expandedFaq === index ? '16px' : '0'
                }}
              >
                <p className="text-gray-600 pl-7">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const StatsSection = () => (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-32 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, index) => (
          <StatCard key={index} stat={stat} />
        ))}
      </div>
    </motion.div>
  );

  const StatCard = ({ stat }) => (
    <div
      className={`p-8 bg-white/70 backdrop-blur-sm rounded-3xl border border-purple-100/30
        bg-gradient-to-br ${stat.gradient} relative overflow-hidden group`}
    >
      <div className="text-4xl mb-4">
        {stat.icon}
      </div>
      <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
        {stat.number}
      </div>
      <div className="text-gray-600 mt-2 text-lg font-medium">
        {stat.label}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Simplified background with static gradients instead of animations */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        style={{ y }}
        className="max-w-7xl mx-auto px-4 py-4 relative"
      >
        <HeroSection />
        <TrustBadgesSection />
        <FeaturesSection />
        <FaqSection />
        <StatsSection />
      </motion.div>
    </div>
  );
};

export default Home;