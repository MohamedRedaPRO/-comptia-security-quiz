import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Collapse,
  Fab,
  Snackbar,
  Card,
  CardContent,
  Avatar,
  Fade,
  Slide,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import TimerIcon from '@mui/icons-material/Timer';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NotesIcon from '@mui/icons-material/Notes';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QuizIcon from '@mui/icons-material/Quiz';
import { Question, TestConfig, TestSession } from '../types/quiz';
import { QuestionService } from '../services/questionService';
import { StorageService } from '../services/storageService';
import RichTextEditor from '../components/RichTextEditor';
import SmartSearch from '../components/SmartSearch';

interface QuizState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeSpent: Record<string, number>;
  startTime: Date;
  questionStartTime: Date;
  timeRemaining?: number;
  isSubmitted: boolean;
  showResults: boolean;
}

const Quiz: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config as TestConfig;

  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    timeSpent: {},
    startTime: new Date(),
    questionStartTime: new Date(),
    isSubmitted: false,
    showResults: false,
  });

  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    explanation: string;
  }>({ show: false, isCorrect: false, explanation: '' });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'submit' | 'exit';
  }>({ open: false, type: 'submit' });

  const [notesExpanded, setNotesExpanded] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [copySnackbar, setCopySnackbar] = useState(false);
  const [bookmarkStates, setBookmarkStates] = useState<Record<number, boolean>>({});

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];
  const isBookmarked = currentQuestion ? (bookmarkStates[currentQuestion.id] ?? StorageService.isBookmarked(currentQuestion.id)) : false;

  const handleSubmit = () => {
    if (quizState.isSubmitted) return;

    // Create a final, definitive state for time spent
    const finalTimeSpentState = { ...quizState.timeSpent };
    const lastQuestion = quizState.questions[quizState.currentQuestionIndex];
    if (lastQuestion) {
      const lastQuestionId = lastQuestion.id.toString();
      const timeForLastQuestion = Math.floor((Date.now() - quizState.questionStartTime.getTime()) / 1000);
      finalTimeSpentState[lastQuestionId] = (finalTimeSpentState[lastQuestionId] || 0) + timeForLastQuestion;
    }

    const finalAnswers = quizState.answers;
    const correctAnswers = quizState.questions.filter(q => finalAnswers[q.id.toString()] === q.correctAnswer).length;
    const score = quizState.questions.length > 0 ? (correctAnswers / quizState.questions.length) * 100 : 0;
    const totalTimeSpent = Object.values(finalTimeSpentState).reduce((a, b) => a + b, 0);

    // Record all individual attempts for history
    quizState.questions.forEach(question => {
      const questionId = question.id;
      const selectedAnswer = finalAnswers[questionId.toString()];
      const timeSpentOnQuestion = finalTimeSpentState[questionId.toString()] || 0;

      QuestionService.recordQuestionAttempt(
        questionId,
        selectedAnswer || '', // Pass empty string for unanswered
        timeSpentOnQuestion,
        config.mode,
        sessionId
      );
    });

    // Finalize and update the session object once
    StorageService.updateTestSession(sessionId, {
      answers: finalAnswers,
      questionsAnswered: Object.values(finalAnswers).filter(v => v !== undefined && v !== '').length,
      endTime: new Date(),
      completed: true,
      totalTimeSpent,
      correctAnswers,
      score,
      passed: score >= 75,
    });

    setQuizState(prev => ({ ...prev, isSubmitted: true, showResults: true }));
    setConfirmDialog({ open: false, type: 'submit' });
  };

  // Initialize quiz
  useEffect(() => {
    if (!config) {
      navigate('/');
      return;
    }

    const questions = config.questions || QuestionService.getQuestionsForTestMode(config);
    if (questions.length === 0) {
      alert('No questions available for this configuration.');
      navigate('/');
      return;
    }

    // Create test session
    const testSession: TestSession = {
      id: sessionId,
      mode: config.mode,
      config,
      questions,
      answers: {},
      startTime: new Date(),
      completed: false,
      totalTimeSpent: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    };

    StorageService.startTestSession(testSession);

    setQuizState(prev => ({
      ...prev,
      questions,
      timeRemaining: config.timeLimit ? config.timeLimit * 60 : undefined,
    }));
  }, [config, navigate, sessionId]);

  // Load current question note
  useEffect(() => {
    if (currentQuestion) {
      const note = StorageService.getQuestionNote(currentQuestion.id);
      setCurrentNote(note?.content || '');
      StorageService.addSeenQuestion(currentQuestion.id);
    }
  }, [currentQuestion]);

  const handleSubmitCallback = useCallback(handleSubmit, [quizState, config, sessionId]);

  // Timer effect
  useEffect(() => {
    if (quizState.isSubmitted || quizState.timeRemaining === undefined) return;

    if (quizState.timeRemaining <= 0) {
      handleSubmitCallback();
      return;
    }

    const timer = setInterval(() => {
      setQuizState(prev => ({ 
        ...prev, 
        timeRemaining: prev.timeRemaining !== undefined ? prev.timeRemaining - 1 : undefined 
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState.timeRemaining, quizState.isSubmitted, handleSubmitCallback]);

  const handleAnswerSelect = (answer: string) => {
    const questionId = currentQuestion.id;
    
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId.toString()]: answer }
    }));
  };

  const handleAnswerSubmit = () => {
    if (!currentQuestion) return;
    
    const answer = quizState.answers[currentQuestion.id.toString()];
    if (!answer) return;

    if (config.showExplanations) {
      const timeSpent = Math.floor((Date.now() - quizState.questionStartTime.getTime()) / 1000);
      
      setQuizState(prev => ({
        ...prev,
        timeSpent: { ...prev.timeSpent, [currentQuestion.id.toString()]: timeSpent }
      }));

      QuestionService.recordQuestionAttempt(currentQuestion.id, answer, timeSpent, config.mode, sessionId);
      
      const isCorrect = answer === currentQuestion.correctAnswer;
      setFeedback({
        show: true,
        isCorrect,
        explanation: currentQuestion.explanation,
      });
    }
  };

  const recordCurrentQuestionTime = () => {
    const questionId = currentQuestion.id.toString();
    const timeSpent = Math.floor((Date.now() - quizState.questionStartTime.getTime()) / 1000);
    
    setQuizState(prev => ({
      ...prev,
      timeSpent: { ...prev.timeSpent, [questionId]: (prev.timeSpent[questionId] || 0) + timeSpent },
      questionStartTime: new Date() // Reset for the next question
    }));
  };

  const handleNextQuestion = () => {
    recordCurrentQuestionTime();
    setFeedback({ show: false, isCorrect: false, explanation: '' });
    
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        questionStartTime: new Date()
      }));
    } else {
      // Last question - handle finish
      if (config.mode === 'study' || config.showExplanations) {
        handleSubmit();
      }
    }
  };

  const handlePreviousQuestion = () => {
    recordCurrentQuestionTime();
    if (quizState.currentQuestionIndex > 0) {
      setFeedback({ show: false, isCorrect: false, explanation: '' });
      setQuizState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        questionStartTime: new Date()
      }));
    }
  };

  const handleBookmarkToggle = () => {
    if (!currentQuestion) return;
    
    const newBookmarkState = !isBookmarked;
    
    // Update local state immediately for UI responsiveness
    setBookmarkStates(prev => ({
      ...prev,
      [currentQuestion.id]: newBookmarkState
    }));
    
    // Update storage
    if (newBookmarkState) {
      StorageService.addBookmark(currentQuestion.id);
    } else {
      StorageService.removeBookmark(currentQuestion.id);
    }
  };

  const handleNoteChange = (content: string) => {
    setCurrentNote(content);
    if (currentQuestion) {
      StorageService.addOrUpdateQuestionNote(currentQuestion.id, content);
    }
  };

  useEffect(() => {
    if (quizState.isSubmitted && quizState.showResults) {
      navigate(`/test-result/${sessionId}`);
    }
  }, [quizState.isSubmitted, quizState.showResults, sessionId, navigate]);

  const calculateResults = () => {
    const totalQuestions = quizState.questions.length;
    const answeredQuestions = Object.keys(quizState.answers).length;
    const correctAnswers = quizState.questions.filter(q => 
      quizState.answers[q.id.toString()] === q.correctAnswer
    ).length;
    
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const timeTaken = Math.floor((Date.now() - quizState.startTime.getTime()) / 1000);
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      score,
      timeTaken,
      passed: score >= 75 // CompTIA passing score
    };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyQuestion = async () => {
    if (!currentQuestion) return;

    const questionText = `Question: ${currentQuestion.questionText}\n\nAnswer Options:\n${
      currentQuestion.options.map(option => `${option.letter}. ${option.text}`).join('\n')
    }\n\nDomain: ${currentQuestion.domain.number} - ${currentQuestion.domain.name}`;

    try {
      await navigator.clipboard.writeText(questionText);
      setCopySnackbar(true);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = questionText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySnackbar(true);
    }
  };

  if (!config || quizState.questions.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">Loading quiz...</Typography>
        </Box>
      </Container>
    );
  }

  if (quizState.showResults) {
    return null;
  }

  const progress = ((quizState.currentQuestionIndex + 1) / quizState.questions.length) * 100;
  const selectedAnswer = quizState.answers[currentQuestion.id.toString()];

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Enhanced Header */}
      <Fade in timeout={300}>
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(175, 82, 222, 0.05) 100%)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => setConfirmDialog({ open: true, type: 'exit' })}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3
                }}
              >
                Exit Quiz
              </Button>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {quizState.timeRemaining !== undefined && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    bgcolor: quizState.timeRemaining < 300 ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    transition: 'all 0.3s ease'
                  }}>
                    <Avatar sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: quizState.timeRemaining < 300 ? '#ff3b30' : '#007aff',
                      fontSize: '0.75rem'
                    }}>
                      <TimerIcon sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: quizState.timeRemaining < 300 ? '#ff3b30' : '#007aff'
                      }}
                    >
                      {formatTime(quizState.timeRemaining)}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  bgcolor: 'rgba(0, 122, 255, 0.1)',
                  px: 2,
                  py: 1,
                  borderRadius: 2
                }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#007aff', fontSize: '0.75rem' }}>
                    <QuizIcon sx={{ fontSize: 14 }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#007aff' }}>
                    {quizState.currentQuestionIndex + 1} / {quizState.questions.length}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Enhanced Progress Bar */}
      <Fade in timeout={500}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Progress
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                transition: 'all 0.3s ease',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }
              }} 
            />
          </CardContent>
        </Card>
      </Fade>

      {/* Enhanced Question Card */}
      <Slide direction="up" in timeout={600}>
        <Card sx={{ 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <SmartSearch questionDomain={currentQuestion?.domain?.name}>
              {/* Question Header */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                mb: 4,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Question {quizState.currentQuestionIndex + 1}
                  </Typography>
                  <Chip 
                    label={`Domain ${currentQuestion.domain.number}: ${currentQuestion.domain.name}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={handleCopyQuestion}
                    sx={{
                      bgcolor: 'rgba(0, 122, 255, 0.1)',
                      color: '#007aff',
                      '&:hover': { bgcolor: 'rgba(0, 122, 255, 0.2)' },
                      transition: 'all 0.2s ease'
                    }}
                    title="Copy Question"
                  >
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => setNotesExpanded(!notesExpanded)} 
                    sx={{
                      bgcolor: currentNote ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: currentNote ? '#007aff' : 'text.secondary',
                      '&:hover': { 
                        bgcolor: currentNote ? 'rgba(0, 122, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' 
                      },
                      transition: 'all 0.2s ease'
                    }}
                    title="Notes"
                  >
                    <NotesIcon />
                  </IconButton>
                  <IconButton 
                    onClick={handleBookmarkToggle} 
                    sx={{
                      bgcolor: isBookmarked ? 'rgba(255, 149, 0, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: isBookmarked ? '#ff9500' : 'text.secondary',
                      '&:hover': { 
                        bgcolor: isBookmarked ? 'rgba(255, 149, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' 
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>
              </Box>

              {/* Notes Section */}
              <Collapse in={notesExpanded}>
                <Card sx={{ 
                  mb: 3, 
                  bgcolor: 'rgba(0, 122, 255, 0.02)',
                  border: '1px solid rgba(0, 122, 255, 0.1)'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: 'rgba(0, 122, 255, 0.1)', 
                        color: '#007aff',
                        mr: 2
                      }}>
                        <NotesIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Your Notes
                      </Typography>
                    </Box>
                    <RichTextEditor
                      value={currentNote}
                      onChange={handleNoteChange}
                      placeholder="Add your notes for this question..."
                      minHeight={120}
                    />
                  </CardContent>
                </Card>
              </Collapse>

              {/* Question Text */}
              <Typography 
                variant="h6" 
                paragraph 
                sx={{ 
                  fontSize: '1.2rem', 
                  lineHeight: 1.7,
                  fontWeight: 500,
                  mb: 4
                }}
              >
                {currentQuestion.questionText}
              </Typography>

              {/* Answer Options */}
              <RadioGroup
                value={selectedAnswer || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                sx={{ gap: 1 }}
              >
                {currentQuestion.options.map((option, index) => (
                  <Fade key={option.letter} in timeout={300 + (index * 100)}>
                    <Card sx={{
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: selectedAnswer === option.letter 
                        ? '2px solid #007aff' 
                        : '1px solid rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        borderColor: selectedAnswer === option.letter ? '#007aff' : 'rgba(0, 122, 255, 0.3)'
                      }
                    }}>
                      <CardContent sx={{ py: 2 }}>
                        <FormControlLabel
                          value={option.letter}
                          control={<Radio sx={{ mr: 2 }} />}
                          label={
                            <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>
                              {option.letter}. {option.text}
                            </Typography>
                          }
                          sx={{ 
                            width: '100%',
                            m: 0,
                            alignItems: 'flex-start'
                          }}
                          disabled={feedback.show}
                        />
                      </CardContent>
                    </Card>
                  </Fade>
                ))}
              </RadioGroup>

              {/* Feedback Section */}
              {feedback.show && (
                <Fade in timeout={300}>
                  <Card sx={{ 
                    mt: 4,
                    bgcolor: feedback.isCorrect ? 'rgba(52, 199, 89, 0.05)' : 'rgba(0, 122, 255, 0.05)',
                    border: `1px solid ${feedback.isCorrect ? 'rgba(52, 199, 89, 0.2)' : 'rgba(0, 122, 255, 0.2)'}`
                  }}>
                    <CardContent>
                      <Alert 
                        severity={feedback.isCorrect ? 'success' : 'info'} 
                        sx={{ 
                          mb: 2,
                          borderRadius: 2,
                          '& .MuiAlert-message': { fontWeight: 600 }
                        }}
                      >
                        {feedback.isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${currentQuestion.correctAnswer}.`}
                      </Alert>
                      {feedback.explanation && (
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Explanation:
                          </Typography>
                          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            {feedback.explanation}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Fade>
              )}
            </SmartSearch>

            {/* Enhanced Navigation */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 4,
              pt: 3,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}>
              <Button
                onClick={handlePreviousQuestion}
                disabled={quizState.currentQuestionIndex === 0}
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Previous
              </Button>

              {config.showExplanations ? (
                feedback.show ? (
                  <Button
                    onClick={handleNextQuestion}
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(0, 122, 255, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {quizState.currentQuestionIndex === quizState.questions.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleAnswerSubmit}
                    variant="contained"
                    disabled={!selectedAnswer}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(0, 122, 255, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Submit Answer
                  </Button>
                )
              ) : (
                quizState.currentQuestionIndex === quizState.questions.length - 1 ? (
                  <Button
                    onClick={() => setConfirmDialog({ open: true, type: 'submit' })}
                    variant="contained"
                    disabled={Object.keys(quizState.answers).length === 0}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(0, 122, 255, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      borderRadius: 3,
                      px: 4,
                      py: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(0, 122, 255, 0.4)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Next
                  </Button>
                )
              )}
            </Box>
          </CardContent>
        </Card>
      </Slide>

      {/* Enhanced Floating Notes Button */}
      {!notesExpanded && (
        <Fade in timeout={800}>
          <Fab
            color={currentNote ? 'primary' : 'default'}
            size="medium"
            onClick={() => setNotesExpanded(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: { xs: 'flex', md: 'none' },
              boxShadow: '0 8px 24px rgba(0, 122, 255, 0.3)',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 12px 32px rgba(0, 122, 255, 0.4)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <NotesIcon />
          </Fab>
        </Fade>
      )}

      {/* Enhanced Dialogs */}
      <Dialog 
        open={confirmDialog.open} 
        onClose={() => setConfirmDialog({ open: false, type: 'submit' })}
        PaperProps={{
          sx: {
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          {confirmDialog.type === 'submit' ? 'Submit Quiz?' : 'Exit Quiz?'}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {confirmDialog.type === 'submit' 
              ? `Are you sure you want to submit your quiz? You have answered ${Object.keys(quizState.answers).length} out of ${quizState.questions.length} questions.`
              : 'Are you sure you want to exit? Your progress will be lost.'
            }
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setConfirmDialog({ open: false, type: 'submit' })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDialog.type === 'submit' ? handleSubmit : () => navigate('/')}
            variant="contained"
            color={confirmDialog.type === 'submit' ? 'primary' : 'error'}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {confirmDialog.type === 'submit' ? 'Submit' : 'Exit'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copySnackbar}
        autoHideDuration={3000}
        onClose={() => setCopySnackbar(false)}
        message="Question copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default Quiz; 