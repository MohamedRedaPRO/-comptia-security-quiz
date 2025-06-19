const fs = require('fs');
const path = require('path');

/**
 * This script is designed to repair a corrupted quiz data file.
 * It performs the following steps:
 * 1. Reads the `corrupted_data.json` file.
 * 2. Deduplicates the test sessions to ensure each session is counted only once.
 * 3. Rebuilds the detailed `questionAttempts` array from the historical test sessions.
 * 4. Recalculates the `userProgress` summary object from the rebuilt attempts.
 * 5. Writes the fully repaired data to a new `repaired_data.json` file.
 */

function repairQuizData() {
    // --- Step 1: Read the corrupted data file ---
    let data;
    const corruptedDataPath = 'corrupted_data.json';
    if (!fs.existsSync(corruptedDataPath)) {
        console.error(`\n❌ Error: The file '${corruptedDataPath}' was not found.`);
        console.error("Please save the JSON data you provided into a file with that name in the same directory as this script.\n");
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(corruptedDataPath, 'utf-8');
        data = JSON.parse(rawData);
        console.log("✅ Successfully read and parsed the corrupted data file.");
    } catch (e) {
        console.error("\n❌ Error: Could not parse the data from 'corrupted_data.json'.", e);
        console.error("Please ensure the file contains the exact JSON blob you provided earlier.\n");
        process.exit(1);
    }

    // --- Step 2: Deduplicate Test Sessions ---
    const seenSessionIds = new Set();
    const uniqueSessions = [];
    if (data.testSessions && Array.isArray(data.testSessions)) {
        for (const session of data.testSessions) {
            if (session && session.id && !seenSessionIds.has(session.id)) {
                uniqueSessions.push(session);
                seenSessionIds.add(session.id);
            }
        }
    }
    data.testSessions = uniqueSessions;
    console.log(`ℹ️ Deduplicated sessions. Found ${uniqueSessions.length} unique test sessions.`);

    // --- Step 3: Rebuild Question Attempts from Sessions ---
    const newQuestionAttempts = [];
    const allQuestionsFromSessions = new Map();

    // First, gather all unique questions from all sessions into a map for easy lookup.
    for (const session of data.testSessions) {
        const questions = session.questions || (session.config && session.config.questions) || [];
        for (const q of questions) {
            if (q && q.id && !allQuestionsFromSessions.has(q.id)) {
                allQuestionsFromSessions.set(q.id, q);
            }
        }
    }

    // Now, create a detailed attempt record for each answered question in each completed session.
    for (const session of data.testSessions) {
        if (session.completed && session.answers) {
            for (const questionIdStr in session.answers) {
                const questionId = parseInt(questionIdStr, 10);
                const selectedAnswer = session.answers[questionIdStr];
                const question = allQuestionsFromSessions.get(questionId);

                if (question) {
                    const attempt = {
                        questionId: question.id,
                        selectedAnswer: selectedAnswer,
                        correctAnswer: question.correctAnswer,
                        isCorrect: selectedAnswer === question.correctAnswer,
                        timeSpent: session.totalTimeSpent / session.questionsAnswered || 15, // Estimate time spent, or use 15s default
                        timestamp: new Date(session.endTime || session.startTime),
                        testMode: session.mode,
                        sessionId: session.id
                    };
                    newQuestionAttempts.push(attempt);
                }
            }
        }
    }
    data.questionAttempts = newQuestionAttempts;
    console.log(`ℹ️ Rebuilt question attempts log. Found ${newQuestionAttempts.length} total attempts.`);

    // --- Step 4: Recalculate User Progress Summary ---
    const newUserProgress = {
        totalQuestionsAttempted: 0,
        totalCorrectAnswers: 0,
        overallAccuracy: 0,
        totalTimeSpent: 0,
        domainProgress: {},
        weakAreas: [],
        strongAreas: [],
        lastStudySession: new Date(0),
        studyStreak: 0, // Cannot be accurately rebuilt, will be reset.
    };
    
    // We need the original questions data to map attempts back to domains.
    const questionsPath = path.join(__dirname, 'src/data/questions.json');
    if (!fs.existsSync(questionsPath)) {
        console.error(`\n❌ Error: Could not find 'src/data/questions.json'.`);
        console.error(`Please make sure you are running this script from the root of your project directory.\n`);
        process.exit(1);
    }
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
    const questionsById = new Map(questionsData.map(q => [q.id, q]));

    for (const attempt of data.questionAttempts) {
        newUserProgress.totalQuestionsAttempted++;
        newUserProgress.totalTimeSpent += attempt.timeSpent;
        if (attempt.isCorrect) {
            newUserProgress.totalCorrectAnswers++;
        }

        const question = questionsById.get(attempt.questionId);
        if (question && question.domain) {
            const domainNumber = question.domain.number;
            if (!newUserProgress.domainProgress[domainNumber]) {
                newUserProgress.domainProgress[domainNumber] = {
                    domainNumber: domainNumber,
                    attemptedQuestions: 0,
                    correctAnswers: 0,
                    // These will be calculated after iterating through all attempts
                    accuracy: 0, 
                    averageTimePerQuestion: 0,
                    lastAttempted: new Date(0)
                };
            }
            const dp = newUserProgress.domainProgress[domainNumber];
            dp.attemptedQuestions++;
            if (attempt.isCorrect) {
                dp.correctAnswers++;
            }
            if (new Date(attempt.timestamp) > new Date(dp.lastAttempted)) {
                dp.lastAttempted = attempt.timestamp;
            }
        }
        
        if (new Date(attempt.timestamp) > new Date(newUserProgress.lastStudySession)) {
            newUserProgress.lastStudySession = attempt.timestamp;
        }
    }
    
    // Final calculations for accuracy and averages
    if (newUserProgress.totalQuestionsAttempted > 0) {
        newUserProgress.overallAccuracy = (newUserProgress.totalCorrectAnswers / newUserProgress.totalQuestionsAttempted) * 100;
    }

    for (const domainNumber in newUserProgress.domainProgress) {
        const dp = newUserProgress.domainProgress[domainNumber];
        const totalTimeForDomain = data.questionAttempts
            .filter(a => questionsById.get(a.questionId)?.domain.number == domainNumber)
            .reduce((sum, a) => sum + a.timeSpent, 0);

        if (dp.attemptedQuestions > 0) {
            dp.accuracy = (dp.correctAnswers / dp.attemptedQuestions) * 100;
            dp.averageTimePerQuestion = totalTimeForDomain / dp.attemptedQuestions;
        }
    }

    data.userProgress = newUserProgress;
    console.log("ℹ️ Rebuilt user progress summary object.");

    // --- Step 5: Write the repaired data to a new file ---
    const repairedDataPath = 'repaired_data.json';
    try {
        fs.writeFileSync(repairedDataPath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`\n🎉 Repair complete!`);
        console.log(`A file named '${repairedDataPath}' has been created in this directory.`);
        console.log("\nFollow these final steps:");
        console.log("1. Open `restore_progress.html` in your browser.");
        console.log("2. Open the new `repaired_data.json` file and copy its entire content.");
        console.log("3. Paste the content into the text box on the restore page and click 'Restore Progress'.");
        console.log("4. Refresh the main quiz application. Your full progress should be restored.\n");
    } catch (e) {
        console.error("\n❌ Error: Could not write the repaired data file.", e);
    }
}

repairQuizData(); 