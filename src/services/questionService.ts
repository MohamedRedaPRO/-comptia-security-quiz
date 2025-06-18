import { StorageService } from './storageService';
// Use the extracted questions from the CompTIA Security+ book
import questionsData from '../data/questions.json';
import { BookmarkedQuestion, Question, QuestionAttempt, TestConfig, TestMode } from '../types/quiz';

export class QuestionService {
  private static questions: Question[] = questionsData as Question[];

  static getAllQuestions(): Question[] {
    return this.questions;
  }

  static getQuestionsByDomain(domainNumber: number): Question[] {
    return this.questions.filter(q => q.domain.number === domainNumber);
  }

  static getRandomQuestions(count: number): Question[] {
    const shuffled = [...this.questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.questions.length));
  }

  static getQuestionById(id: number): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  static getDomains() {
    const domains = new Map();
    this.questions.forEach(q => {
      if (!domains.has(q.domain.number)) {
        domains.set(q.domain.number, q.domain);
      }
    });
    return Array.from(domains.values()).sort((a, b) => a.number - b.number);
  }

  // New methods for test modes and persistent memory
  static getQuestionsForTestMode(config: TestConfig): Question[] {
    let questionsPool: Question[] = this.questions;

    // Filter by domain if specified
    if (config.domainNumbers && config.domainNumbers.length > 0) {
      questionsPool = questionsPool.filter(q => config.domainNumbers!.includes(q.domain.number));
    }

    let questions: Question[] = [];

    // --- Smart prioritization logic ---
    const questionCount = config.questionCount || 10;
    const priority = config.questionPriority || 'mix';
    const incorrectIds = StorageService.getIncorrectQuestions();
    // Get all question IDs from the potentially filtered pool
    const allQuestionIds = questionsPool.map(q => q.id);
    const unseenIds = StorageService.getUnseenQuestions(allQuestionIds);

    if (priority === 'wrong') {
      // Prioritize wrong, fill with random if not enough
      const wrongQs = questionsPool.filter(q => incorrectIds.includes(q.id));
      const needed = questionCount - wrongQs.length;
      let pool = wrongQs;
      if (needed > 0) {
        const filler = questionsPool.filter(q => !incorrectIds.includes(q.id)).sort(() => 0.5 - Math.random()).slice(0, needed);
        pool = [...wrongQs, ...filler];
      }
      questions = pool.sort(() => 0.5 - Math.random()).slice(0, questionCount);
    } else if (priority === 'new') {
      // Prioritize unseen, fill with random if not enough
      const newQs = questionsPool.filter(q => unseenIds.includes(q.id));
      const shuffledNewQs = [...newQs].sort(() => 0.5 - Math.random());
      const needed = questionCount - shuffledNewQs.length;
      let pool = shuffledNewQs;
      if (needed > 0) {
        const filler = questionsPool.filter(q => !unseenIds.includes(q.id)).sort(() => 0.5 - Math.random()).slice(0, needed);
        pool = [...shuffledNewQs, ...filler];
      }
      questions = pool.sort(() => 0.5 - Math.random()).slice(0, questionCount);
    } else if (priority === 'mix') {
      // Mix: 40% wrong, 30% new, 30% random
      const nWrong = Math.round(questionCount * 0.4);
      const nNew = Math.round(questionCount * 0.3);
      const nRand = questionCount - nWrong - nNew;
      const wrongQs = questionsPool.filter(q => incorrectIds.includes(q.id)).sort(() => 0.5 - Math.random()).slice(0, nWrong);
      const newQs = questionsPool.filter(q => unseenIds.includes(q.id) && !incorrectIds.includes(q.id)).sort(() => 0.5 - Math.random()).slice(0, nNew);
      const usedIds = new Set([...wrongQs, ...newQs].map(q => q.id));
      const randQs = questionsPool.filter(q => !usedIds.has(q.id)).sort(() => 0.5 - Math.random()).slice(0, nRand);
      questions = [...wrongQs, ...newQs, ...randQs].sort(() => 0.5 - Math.random());
    } else {
      // fallback: random
      questions = questionsPool.sort(() => 0.5 - Math.random()).slice(0, questionCount);
    }

    // Shuffle options if requested
    if (config.shuffleOptions) {
      questions = questions.map(q => ({
        ...q,
        options: [...q.options].sort(() => 0.5 - Math.random())
      }));
    }

    return questions;
  }

  static getExamSimulationQuestions(): Question[] {
    // CompTIA Security+ exam has 90 questions with domain weighting
    const domainWeights = {
      1: 12, // General Security Concepts
      2: 22, // Threats, Vulnerabilities, and Mitigations  
      3: 18, // Security Architecture
      4: 28, // Security Operations
      5: 20  // Security Program Management and Oversight
    };

    const totalQuestions = 90;
    const questionsByDomain: Question[] = [];

    Object.entries(domainWeights).forEach(([domainStr, weight]) => {
      const domainNumber = parseInt(domainStr);
      const questionsNeeded = Math.round((weight / 100) * totalQuestions);
      const domainQuestions = this.getQuestionsByDomain(domainNumber);
      
      // Randomly select questions from this domain
      const selectedQuestions = domainQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(questionsNeeded, domainQuestions.length));
      
      questionsByDomain.push(...selectedQuestions);
    });

    // Shuffle the final question set
    return questionsByDomain.sort(() => 0.5 - Math.random());
  }

  static getUnseenQuestions(domainNumber?: number): Question[] {
    const allQuestions = domainNumber 
      ? this.getQuestionsByDomain(domainNumber)
      : this.questions;
    
    const allQuestionIds = allQuestions.map(q => q.id);
    const unseenIds = StorageService.getUnseenQuestions(allQuestionIds);
    
    return this.questions.filter(q => unseenIds.includes(q.id));
  }

  static getIncorrectQuestions(): Question[] {
    const incorrectIds = StorageService.getIncorrectQuestions();
    return this.questions.filter(q => incorrectIds.includes(q.id));
  }

  static getCorrectlyAnsweredQuestions(): Question[] {
    const correctlyAnsweredIds = StorageService.getCorrectlyAnsweredQuestions();
    return this.questions.filter(q => correctlyAnsweredIds.includes(q.id));
  }

  static getAnsweredQuestions(): Question[] {
    const incorrect = this.getIncorrectQuestions();
    const correct = this.getCorrectlyAnsweredQuestions();
    const allAnswered = [...incorrect, ...correct];
    // Remove duplicates
    return allAnswered.filter((q, index) => allAnswered.findIndex(item => item.id === q.id) === index);
  }

  static getBookmarkedQuestions(): Question[] {
    const bookmarkedIds = StorageService.getBookmarkedQuestions().map((b: BookmarkedQuestion) => b.questionId);
    return this.questions.filter(q => bookmarkedIds.includes(q.id));
  }

  static getSeenQuestionsLog(): Question[] {
    const seenIds = StorageService.getSeenQuestions();
    return this.questions.filter(q => seenIds.includes(q.id));
  }

  static getCustomTestQuestions(
    count: number,
    seenStatus: 'all' | 'seen' | 'unseen'
  ): Question[] {
    const allQuestions = this.getAllQuestions();
    const seenIds = new Set(StorageService.getSeenQuestions());
    
    let candidates: Question[] = [];

    if (seenStatus === 'unseen') {
      candidates = allQuestions.filter(q => !seenIds.has(q.id));
    } else if (seenStatus === 'seen') {
      candidates = allQuestions.filter(q => seenIds.has(q.id));
    } else { // 'all'
      candidates = allQuestions;
    }
    
    return candidates.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  static getQuestionStats(questionId: number) {
    const data = StorageService.loadData();
    const attempts = data.questionAttempts.filter((a: QuestionAttempt) => a.questionId === questionId);
    
    if (attempts.length === 0) {
      return {
        timesAttempted: 0,
        timesCorrect: 0,
        accuracy: 0,
        averageTime: 0,
        lastAttempted: null
      };
    }

    const timesCorrect = attempts.filter((a: QuestionAttempt) => a.isCorrect).length;
    const totalTime = attempts.reduce((sum, a: QuestionAttempt) => sum + a.timeSpent, 0);
    const lastAttempt = attempts.sort((a: QuestionAttempt, b: QuestionAttempt) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return {
      timesAttempted: attempts.length,
      timesCorrect,
      accuracy: (timesCorrect / attempts.length) * 100,
      averageTime: totalTime / attempts.length,
      lastAttempted: lastAttempt.timestamp
    };
  }

  static recordQuestionAttempt(
    questionId: number, 
    selectedAnswer: string, 
    timeSpent: number, 
    testMode: TestMode,
    sessionId?: string
  ): void {
    const question = this.getQuestionById(questionId);
    if (!question) return;

    const isCorrect = selectedAnswer === question.correctAnswer;
    
    const attempt = {
      questionId,
      selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      timeSpent,
      timestamp: new Date(),
      testMode,
      sessionId
    };

    StorageService.addQuestionAttempt(attempt);
    StorageService.updateDomainProgress(question.domain.number, isCorrect, timeSpent);
  }
} 