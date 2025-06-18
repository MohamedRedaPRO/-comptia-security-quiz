export interface Domain {
  number: number;
  name: string;
  weight: number;
}

export interface Option {
  letter: string;
  text: string;
}

export interface Question {
  id: number;
  domain: Domain;
  questionText: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  questionType: 'multiple-choice' | 'multiple-response' | 'fill-in-the-blank' | 'drag-and-drop' | 'image-based';
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, string>;
  flaggedQuestions: Set<number>;
  timeRemaining: number;
  isSubmitted: boolean;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  passed: boolean;
}

// New types for persistent memory and test modes
export type TestMode = 
  | 'study'           // Current mode - immediate feedback
  | 'practice'        // Timed, no immediate feedback
  | 'domain-focus'    // Focus on specific domains
  | 'review'          // Review incorrect/bookmarked questions
  | 'quick-quiz'      // Short random quiz
  | 'exam-simulation' // Full exam simulation
  | 'custom';         // Custom test mode

export interface TestConfig {
  mode: TestMode;
  domainNumbers?: number[];
  questionCount?: number;
  timeLimit?: number; // in minutes
  showExplanations?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  questionPriority?: 'wrong' | 'new' | 'mix'; // Added for smart selection
  questions?: Question[]; // For pre-loaded questions
}

export interface QuestionAttempt {
  questionId: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  timestamp: Date;
  testMode: TestMode;
  sessionId?: string; // Link to test session
}

export interface QuestionNote {
  questionId: number;
  content: string; // Rich text content (HTML)
  timestamp: Date;
  lastModified: Date;
}

export interface BookmarkedQuestion {
  questionId: number;
  note?: string;
  timestamp: Date;
}

export interface DomainProgress {
  domainNumber: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  lastAttempted: Date;
}

export interface UserProgress {
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  overallAccuracy: number;
  totalTimeSpent: number; // in seconds
  domainProgress: Record<number, DomainProgress>;
  weakAreas: number[]; // domain numbers with low accuracy
  strongAreas: number[]; // domain numbers with high accuracy
  lastStudySession: Date;
  studyStreak: number; // consecutive days
}

export interface TestSession {
  id: string;
  mode: TestMode;
  config: TestConfig;
  questions: Question[];
  answers: Record<string, string>; // questionId -> selectedAnswer
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  score?: number;
  passed?: boolean;
  totalTimeSpent: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface TestHistoryEntry {
  session: TestSession;
  questionDetails: Array<{
    question: Question;
    selectedAnswer?: string;
    isCorrect?: boolean;
    timeSpent?: number;
  }>;
}

export interface PersistentData {
  userProgress: UserProgress;
  questionAttempts: QuestionAttempt[];
  bookmarkedQuestions: BookmarkedQuestion[];
  testSessions: TestSession[];
  questionNotes: QuestionNote[];
  settings: UserSettings;
  seenQuestions: number[];
}

export interface UserSettings {
  defaultTestMode: TestMode;
  autoSaveProgress: boolean;
  showTimerInStudyMode: boolean;
  playSound: boolean;
  darkMode: boolean;
  questionsPerSession: number;
} 