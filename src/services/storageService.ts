import { 
  PersistentData, 
  UserProgress, 
  QuestionAttempt, 
  BookmarkedQuestion, 
  TestSession, 
  UserSettings,
  QuestionNote,
  TestHistoryEntry
} from '../types/quiz';

const STORAGE_KEY = 'comptia-security-quiz-data';

export class StorageService {
  private static getDefaultData(): PersistentData {
    return {
      userProgress: {
        totalQuestionsAttempted: 0,
        totalCorrectAnswers: 0,
        overallAccuracy: 0,
        totalTimeSpent: 0,
        domainProgress: {},
        weakAreas: [],
        strongAreas: [],
        lastStudySession: new Date(),
        studyStreak: 0
      },
      questionAttempts: [],
      bookmarkedQuestions: [],
      testSessions: [],
      questionNotes: [],
      settings: {
        defaultTestMode: 'study',
        autoSaveProgress: true,
        showTimerInStudyMode: false,
        playSound: false,
        darkMode: false,
        questionsPerSession: 20
      },
      seenQuestions: []
    };
  }

  static loadData(): PersistentData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return this.getDefaultData();
      }

      const parsed = JSON.parse(stored);
      
      if (parsed.userProgress?.lastStudySession) {
        parsed.userProgress.lastStudySession = new Date(parsed.userProgress.lastStudySession);
      }
      
      parsed.questionAttempts = parsed.questionAttempts?.map((attempt: any) => ({
        ...attempt,
        timestamp: new Date(attempt.timestamp)
      })) || [];

      parsed.bookmarkedQuestions = parsed.bookmarkedQuestions?.map((bookmark: any) => ({
        ...bookmark,
        timestamp: new Date(bookmark.timestamp)
      })) || [];

      parsed.testSessions = parsed.testSessions?.map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
        answers: session.answers || {},
        totalTimeSpent: session.totalTimeSpent || 0,
        questionsAnswered: session.questionsAnswered || 0,
        correctAnswers: session.correctAnswers || 0
      })) || [];

      parsed.questionNotes = parsed.questionNotes?.map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp),
        lastModified: new Date(note.lastModified)
      })) || [];

      return { ...this.getDefaultData(), ...parsed };
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return this.getDefaultData();
    }
  }

  static saveData(data: PersistentData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  static addQuestionAttempt(attempt: QuestionAttempt): void {
    const data = this.loadData();
    data.questionAttempts.push(attempt);
    this.updateUserProgress(data, attempt);
    this.saveData(data);
  }

  static addBookmark(questionId: number, note?: string): void {
    const data = this.loadData();
    data.bookmarkedQuestions = data.bookmarkedQuestions.filter(
      b => b.questionId !== questionId
    );
    data.bookmarkedQuestions.push({
      questionId,
      note,
      timestamp: new Date()
    });
    this.saveData(data);
  }

  static removeBookmark(questionId: number): void {
    const data = this.loadData();
    data.bookmarkedQuestions = data.bookmarkedQuestions.filter(
      b => b.questionId !== questionId
    );
    this.saveData(data);
  }

  static isBookmarked(questionId: number): boolean {
    const data = this.loadData();
    return data.bookmarkedQuestions.some(b => b.questionId === questionId);
  }

  static getBookmarkedQuestions(): BookmarkedQuestion[] {
    const data = this.loadData();
    return data.bookmarkedQuestions;
  }

  static startTestSession(session: TestSession): void {
    const data = this.loadData();
    data.testSessions.push(session);
    this.saveData(data);
  }

  static updateTestSession(sessionId: string, updates: Partial<TestSession>): void {
    const data = this.loadData();
    const sessionIndex = data.testSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      data.testSessions[sessionIndex] = { ...data.testSessions[sessionIndex], ...updates };
      this.saveData(data);
    }
  }

  static getTestSessions(): TestSession[] {
    const data = this.loadData();
    return data.testSessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  static getUserProgress(): UserProgress {
    const data = this.loadData();
    return data.userProgress;
  }

  static getSettings(): UserSettings {
    const data = this.loadData();
    return data.settings;
  }

  static updateSettings(settings: Partial<UserSettings>): void {
    const data = this.loadData();
    data.settings = { ...data.settings, ...settings };
    this.saveData(data);
  }

  static getIncorrectQuestions(): number[] {
    const data = this.loadData();
    const incorrectAttempts = data.questionAttempts.filter(a => !a.isCorrect);
    const incorrectQuestionIds = Array.from(new Set(incorrectAttempts.map(a => a.questionId)));
    return incorrectQuestionIds.filter(questionId => {
      const questionAttempts = data.questionAttempts
        .filter(a => a.questionId === questionId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return questionAttempts.length > 0 && !questionAttempts[0].isCorrect;
    });
  }

  static getCorrectlyAnsweredQuestions(): number[] {
    const data = this.loadData();
    const correctAttempts = data.questionAttempts.filter(a => a.isCorrect);
    const correctQuestionIds = new Set(correctAttempts.map(a => a.questionId));
    
    // a question is correctly answered if its last attempt was correct
    return Array.from(correctQuestionIds).filter(questionId => {
      const questionAttempts = data.questionAttempts
        .filter(a => a.questionId === questionId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return questionAttempts.length > 0 && questionAttempts[0].isCorrect;
    });
  }

  static getUnseenQuestions(allQuestionIds: number[]): number[] {
    const data = this.loadData();
    const seenQuestionIds = new Set(data.seenQuestions || []);
    return allQuestionIds.filter(id => !seenQuestionIds.has(id));
  }

  static getSeenQuestions(): number[] {
    const data = this.loadData();
    return data.seenQuestions || [];
  }

  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private static updateUserProgress(data: PersistentData, attempt: QuestionAttempt): void {
    const progress = data.userProgress;
    progress.totalQuestionsAttempted++;
    if (attempt.isCorrect) {
      progress.totalCorrectAnswers++;
    }
    progress.overallAccuracy = (progress.totalCorrectAnswers / progress.totalQuestionsAttempted) * 100;
    progress.totalTimeSpent += attempt.timeSpent;
    
    // Fix date handling for streak calculation  
    const today = new Date();
    const lastSessionDate = new Date(progress.lastStudySession);
    
    // Compare dates properly (ignore time)
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastSessionDateOnly = new Date(lastSessionDate.getFullYear(), lastSessionDate.getMonth(), lastSessionDate.getDate());
    const yesterdayDateOnly = new Date(todayDateOnly);
    yesterdayDateOnly.setDate(yesterdayDateOnly.getDate() - 1);
    
    if (lastSessionDateOnly.getTime() !== todayDateOnly.getTime()) {
      if (lastSessionDateOnly.getTime() === yesterdayDateOnly.getTime()) {
        progress.studyStreak++;
      } else {
        progress.studyStreak = 1; 
      }
      progress.lastStudySession = today;
    }
  }

  static updateDomainProgress(domainNumber: number, isCorrect: boolean, timeSpent: number): void {
    const data = this.loadData();
    const progress = data.userProgress;
    if (!progress.domainProgress[domainNumber]) {
      progress.domainProgress[domainNumber] = {
        domainNumber,
        totalQuestions: 0,
        attemptedQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageTimePerQuestion: 0,
        lastAttempted: new Date()
      };
    }
    const domainProgress = progress.domainProgress[domainNumber];
    domainProgress.attemptedQuestions++;
    if (isCorrect) {
      domainProgress.correctAnswers++;
    }
    domainProgress.accuracy = (domainProgress.correctAnswers / domainProgress.attemptedQuestions) * 100;
    const totalTime = domainProgress.averageTimePerQuestion * (domainProgress.attemptedQuestions - 1) + timeSpent;
    domainProgress.averageTimePerQuestion = totalTime / domainProgress.attemptedQuestions;
    domainProgress.lastAttempted = new Date();
    this.updateWeakAndStrongAreas(progress);
    this.saveData(data);
  }

  private static updateWeakAndStrongAreas(progress: UserProgress): void {
    const domainAccuracies = Object.values(progress.domainProgress)
      .filter(dp => dp.attemptedQuestions >= 5)
      .map(dp => ({ domain: dp.domainNumber, accuracy: dp.accuracy }));
    domainAccuracies.sort((a, b) => a.accuracy - b.accuracy);
    const weakCount = Math.ceil(domainAccuracies.length * 0.4);
    progress.weakAreas = domainAccuracies.slice(0, weakCount).map(d => d.domain);
    const strongCount = Math.ceil(domainAccuracies.length * 0.4);
    progress.strongAreas = domainAccuracies.slice(-strongCount).map(d => d.domain);
  }

  static addOrUpdateQuestionNote(questionId: number, content: string): void {
    const data = this.loadData();
    const existingNoteIndex = data.questionNotes.findIndex(n => n.questionId === questionId);
    if (existingNoteIndex !== -1) {
      data.questionNotes[existingNoteIndex].content = content;
      data.questionNotes[existingNoteIndex].lastModified = new Date();
    } else {
      data.questionNotes.push({
        questionId,
        content,
        timestamp: new Date(),
        lastModified: new Date()
      });
    }
    this.saveData(data);
  }

  static getQuestionNote(questionId: number): QuestionNote | null {
    const data = this.loadData();
    return data.questionNotes.find(n => n.questionId === questionId) || null;
  }

  static removeQuestionNote(questionId: number): void {
    const data = this.loadData();
    data.questionNotes = data.questionNotes.filter(n => n.questionId !== questionId);
    this.saveData(data);
  }

  static getAllQuestionNotes(): QuestionNote[] {
    const data = this.loadData();
    return data.questionNotes;
  }

  static getTestHistory(): TestHistoryEntry[] {
    const data = this.loadData();
    return data.testSessions
      .filter(session => session.completed)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .map(session => ({
        session,
        questionDetails: session.questions.map(question => {
          const answers = session.answers as Record<string | number, string>;
          const selectedAnswer = answers[question.id] || answers[question.id.toString()];
          const isCorrect = selectedAnswer === question.correctAnswer;
          const attempt = data.questionAttempts.find(
            a => a.questionId === question.id && a.sessionId === session.id
          );
          return {
            question,
            selectedAnswer,
            isCorrect: selectedAnswer ? isCorrect : undefined,
            timeSpent: attempt?.timeSpent
          };
        })
      }));
  }

  static getTestSessionById(sessionId: string): TestSession | null {
    const data = this.loadData();
    return data.testSessions.find(s => s.id === sessionId) || null;
  }

  static deleteTestSession(sessionId: string): void {
    const data = this.loadData();
    data.testSessions = data.testSessions.filter(s => s.id !== sessionId);
    data.questionAttempts = data.questionAttempts.filter(a => a.sessionId !== sessionId);
    this.saveData(data);
  }

  static addSeenQuestion(questionId: number): void {
    const data = this.loadData();
    if (!data.seenQuestions.includes(questionId)) {
      data.seenQuestions.push(questionId);
      this.saveData(data);
    }
  }
} 