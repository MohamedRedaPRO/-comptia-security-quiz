// Quick Test Data Script for Quiz App
// Copy and paste this into your browser console to test functionality

console.log("🎯 Adding test data to quiz application...");

// Clear any existing data first
localStorage.removeItem('comptia-security-quiz-data');

// Create comprehensive test data
const testData = {
  userProgress: {
    totalQuestionsAttempted: 25,
    totalCorrectAnswers: 18,
    overallAccuracy: 72.0,
    totalTimeSpent: 1800, // 30 minutes
    domainProgress: {
      1: {
        domainNumber: 1,
        totalQuestions: 50,
        attemptedQuestions: 8,
        correctAnswers: 6,
        accuracy: 75,
        averageTimePerQuestion: 45,
        lastAttempted: new Date()
      },
      2: {
        domainNumber: 2,
        totalQuestions: 60,
        attemptedQuestions: 10,
        correctAnswers: 6,
        accuracy: 60,
        averageTimePerQuestion: 52,
        lastAttempted: new Date()
      }
    },
    weakAreas: [2, 4],
    strongAreas: [1, 3],
    lastStudySession: new Date(),
    studyStreak: 3
  },
  
  // Add bookmarked questions
  bookmarkedQuestions: [
    {
      questionId: 1,
      note: "Important security concept - need to review",
      timestamp: new Date()
    },
    {
      questionId: 5,
      note: "Tricky cryptography question",
      timestamp: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      questionId: 12,
      note: "Network security - review protocols",
      timestamp: new Date(Date.now() - 7200000) // 2 hours ago
    }
  ],
  
  // Add test sessions (history)
  testSessions: [
    {
      id: "session_" + Date.now() + "_1",
      mode: "practice",
      config: { mode: "practice", questionCount: 10 },
      questions: [
        {
          id: 1,
          questionText: "What is the primary purpose of encryption?",
          domain: { number: 1, name: "General Security Concepts" },
          correctAnswer: "A",
          options: [
            { letter: "A", text: "To ensure confidentiality" },
            { letter: "B", text: "To ensure availability" },
            { letter: "C", text: "To ensure integrity" },
            { letter: "D", text: "To ensure authentication" }
          ],
          explanation: "Encryption primarily ensures confidentiality by making data unreadable to unauthorized users."
        },
        {
          id: 2,
          questionText: "Which of the following is a symmetric encryption algorithm?",
          domain: { number: 2, name: "Threats, Vulnerabilities, and Mitigations" },
          correctAnswer: "B",
          options: [
            { letter: "A", text: "RSA" },
            { letter: "B", text: "AES" },
            { letter: "C", text: "ECC" },
            { letter: "D", text: "DSA" }
          ],
          explanation: "AES (Advanced Encryption Standard) is a symmetric encryption algorithm."
        }
      ],
      answers: { 1: "A", 2: "B" },
      startTime: new Date(Date.now() - 900000), // 15 minutes ago
      endTime: new Date(Date.now() - 300000), // 5 minutes ago
      completed: true,
      score: 85,
      passed: true,
      totalTimeSpent: 600, // 10 minutes
      questionsAnswered: 2,
      correctAnswers: 2
    },
    {
      id: "session_" + Date.now() + "_2",
      mode: "study",
      config: { mode: "study", showExplanations: true },
      questions: [
        {
          id: 5,
          questionText: "What is a digital certificate used for?",
          domain: { number: 3, name: "Security Architecture" },
          correctAnswer: "C",
          options: [
            { letter: "A", text: "Password storage" },
            { letter: "B", text: "Data backup" },
            { letter: "C", text: "Public key verification" },
            { letter: "D", text: "Network routing" }
          ],
          explanation: "Digital certificates are used to verify the authenticity of public keys."
        }
      ],
      answers: { 5: "A" }, // Wrong answer
      startTime: new Date(Date.now() - 1800000), // 30 minutes ago
      endTime: new Date(Date.now() - 1200000), // 20 minutes ago
      completed: true,
      score: 40,
      passed: false,
      totalTimeSpent: 600,
      questionsAnswered: 1,
      correctAnswers: 0
    }
  ],
  
  // Add question attempts
  questionAttempts: [
    {
      questionId: 1,
      selectedAnswer: "A",
      correctAnswer: "A",
      isCorrect: true,
      timeSpent: 45,
      timestamp: new Date(Date.now() - 900000),
      testMode: "practice",
      sessionId: "session_" + Date.now() + "_1"
    },
    {
      questionId: 2,
      selectedAnswer: "B",
      correctAnswer: "B",
      isCorrect: true,
      timeSpent: 60,
      timestamp: new Date(Date.now() - 840000),
      testMode: "practice",
      sessionId: "session_" + Date.now() + "_1"
    },
    {
      questionId: 5,
      selectedAnswer: "A",
      correctAnswer: "C",
      isCorrect: false,
      timeSpent: 90,
      timestamp: new Date(Date.now() - 1800000),
      testMode: "study",
      sessionId: "session_" + Date.now() + "_2"
    }
  ],
  
  // Add question notes
  questionNotes: [
    {
      questionId: 1,
      content: "Remember: Encryption = Confidentiality. Authentication is different!",
      timestamp: new Date(Date.now() - 600000),
      lastModified: new Date(Date.now() - 600000)
    }
  ],
  
  // Settings
  settings: {
    defaultTestMode: "study",
    autoSaveProgress: true,
    showTimerInStudyMode: false,
    playSound: false,
    darkMode: false,
    questionsPerSession: 20
  }
};

// Save the test data
localStorage.setItem('comptia-security-quiz-data', JSON.stringify(testData));

console.log("✅ Test data added successfully!");
console.log("📊 Dashboard will now show:");
console.log("   - 25 Questions Attempted");
console.log("   - 72.0% Overall Accuracy");
console.log("   - 3 Day Streak");
console.log("   - 0h Time Studied");

console.log("🔖 Bookmarks added:");
console.log("   - 3 bookmarked questions with notes");

console.log("📝 Test History added:");
console.log("   - 2 completed test sessions");
console.log("   - 1 passed (85%), 1 failed (40%)");

console.log("\n🔄 Refresh the page to see the changes!");

// Optional: Auto-refresh the page
// window.location.reload(); 