# **📚 Tutorix – Personalized Learning with AI Tutor 🚀**

![Tutorix Banner](/public/assets/banner.webp)

## **🌟 Introduction**
**Tutorix** is an AI-powered **personalized learning platform** designed to **enhance user learning** through **intelligent learning paths, quizzes, and flashcards**. With **Gemini AI**, users get dynamic explanations, and with **gamification**, learning becomes engaging and fun!

---

## **✨ Features**
✅ **AI-Generated Learning Paths** – Personalized courses based on user input.  
✅ **Interactive Quizzes & Flashcards** – AI-generated quizzes & flashcards for better retention.  
✅ **Gamification** – XP, streaks, and leaderboards to keep users engaged.  
✅ **Smart Chatbot Tutor** – Asks follow-up questions before providing AI-driven answers.  
✅ **Progress Tracking** – Users can track their progress in real time.  
✅ **Mobile-Responsive Design** – Optimized for all devices.

---

## **🛠️ Tech Stack**
- ![React](https://img.shields.io/badge/-React-61DAFB?style=for-the-badge&logo=react&logoColor=white) **React.js** – Frontend framework for building UI.  
- ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS** – Styling for responsive & sleek UI.  
- ![Framer](https://img.shields.io/badge/-Framer-0055FF?style=for-the-badge&logo=framer&logoColor=white) **Framer** – For animations & UI enhancements.  
- ![Appwrite](https://img.shields.io/badge/-Appwrite-F02E65?style=for-the-badge&logo=appwrite&logoColor=white) **Appwrite** – Authentication & database management.  
- ![Gemini AI](https://img.shields.io/badge/-Gemini%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white) **Gemini AI** – AI model for generating learning paths & chatbot responses.  
- ![Vite](https://img.shields.io/badge/-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) **Vite** – Lightning-fast development environment.

---

## **🛠️ Installation & Setup**

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/sheetu89/Tutorix.git
cd Tutorix
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Configure Appwrite**
- Create an account on [Appwrite](https://appwrite.io).
- Set up a new **Project** in the Appwrite console.
- Navigate to the **API Keys** section under **Settings** and create a new API key with all permissions.
- Copy the generated API key.
- Create a new **Database** and note its ID.
- Create two collections:
  - **user_progress**: For tracking user progress.
  - **learning_paths**: For managing learning paths.

### **4️⃣ Add Environment Variables**
Create a `.env` file in the root of the project and add the following:
```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_COLLECTION_ID=your_collection_id
APPWRITE_API_KEY=your_appwrite_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### **5️⃣ Run the Attribute Generation Script**
To automatically generate attributes for the collections, run the following command:
```sh
node scripts/generate_attributes.js
```
This script will create the necessary attributes for the `user_progress` and `learning_paths` collections.

### **6️⃣ Run the Project**
Start the development server:
```sh
npm run dev
```

---

## **📌 Project Flow**

1️⃣ **Home Page** – Users visit the platform & can sign up/login.  
2️⃣ **Dashboard** – Displays user progress, available learning paths & quizzes.  
3️⃣ **Learning Path** – AI generates personalized topics & modules.  
4️⃣ **Quiz & Flashcards** – AI-generated questions based on learning material.  
5️⃣ **AI Chatbot Tutor** – Helps users by asking relevant follow-up questions before answering.  
6️⃣ **Progress Tracker** – Visualize learning progress with detailed analytics.

---

## **💡 Future Enhancements**
🔹 **Voice Interaction** – AI-powered voice assistant for learning.  
🔹 **Collaboration Mode** – Study groups & discussions with peers.  
🔹 **AR Learning** – Implement Augmented Reality for an immersive experience.  
🔹 **Offline Mode** – Access learning materials without an internet connection.

---

## **📜 License**
This project is **open-source** under the **MIT License**. Feel free to contribute! 🎉

---

## **📞 Contact & Contributions**
👥 **Want to contribute?** Fork this repo & submit a PR!  
📧 **Need help?** Reach out to us at `sheetalbhardwaj525@gmail.com`.  

🌟 **If you like this project, don’t forget to give it a star!** ⭐🚀

---

**Made with ❤️ by Team Tutorix** 🎓 🚀