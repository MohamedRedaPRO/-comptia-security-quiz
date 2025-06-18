import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  Card,
  CardContent,
  Avatar,
  Fade,
  Slide,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import ScoreIcon from '@mui/icons-material/Score';
import CheckListIcon from '@mui/icons-material/Checklist';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import QuizIcon from '@mui/icons-material/Quiz';
import { TestSession, Question } from '../types/quiz';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import HistoryIcon from '@mui/icons-material/History';
import Tooltip from '@mui/material/Tooltip';

const TestResult: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctHistory, setCorrectHistory] = useState<Set<number>>(new Set());
  const [incorrectHistory, setIncorrectHistory] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (sessionId) {
      const sessions = StorageService.getTestSessions();
      console.log('All sessions:', sessions);
      const currentSession = sessions.find(s => s.id === sessionId);
      console.log('Current session:', currentSession);
      if (currentSession) {
        // Normalize answers, ensure string keys
        const normalizedAnswers: Record<string,string> = {};
        if (currentSession.answers) {
          Object.entries(currentSession.answers).forEach(([k, v]) => {
            if (v !== undefined && v !== '') normalizedAnswers[k.toString()] = v as string;
          });
        }
        // Backfill from attempts for this session
        const allData = StorageService.loadData();
        const attemptsForSession = allData.questionAttempts.filter(a => a.sessionId === currentSession.id);
        attemptsForSession.forEach(a => {
          const key = a.questionId.toString();
          if (!normalizedAnswers[key] && a.selectedAnswer) {
            normalizedAnswers[key] = a.selectedAnswer;
          }
        });
        // Derive stats if they are missing or zero
        const totalQuestions = currentSession.questions.length;
        const derivedCorrect = currentSession.correctAnswers && currentSession.correctAnswers > 0
          ? currentSession.correctAnswers
          : currentSession.questions.filter(q => normalizedAnswers[q.id.toString()] === q.correctAnswer).length;

        const derivedScore = (currentSession.score !== undefined && currentSession.score > 0)
          ? currentSession.score
          : (totalQuestions > 0 ? (derivedCorrect / totalQuestions) * 100 : 0);

        // Calculate total time from attempts if not already stored
        let derivedTime = currentSession.totalTimeSpent;
        if (!derivedTime || derivedTime === 0) {
          derivedTime = attemptsForSession.reduce((acc, a) => acc + (a.timeSpent || 0), 0);
        }

        setSession({
          ...currentSession,
          answers: normalizedAnswers,
          correctAnswers: derivedCorrect,
          score: derivedScore,
          totalTimeSpent: derivedTime
        });
      }
      const correctIds = new Set(QuestionService.getCorrectlyAnsweredQuestions().map(q => q.id));
      const incorrectIds = new Set(QuestionService.getIncorrectQuestions().map(q => q.id));
      setCorrectHistory(correctIds);
      setIncorrectHistory(incorrectIds);
    }
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Avatar sx={{ 
            width: 64, 
            height: 64, 
            mx: 'auto', 
            mb: 2,
            bgcolor: 'rgba(0, 122, 255, 0.1)',
            color: '#007aff'
          }}>
            <QuizIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h6" color="text.secondary">
            Loading your results...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="md">
        <Fade in timeout={300}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 6,
            background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.05) 0%, rgba(255, 149, 0, 0.05) 100%)'
          }}>
            <Avatar sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 3,
              bgcolor: 'rgba(255, 59, 48, 0.1)',
              color: '#ff3b30'
            }}>
              <CancelIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              Session Not Found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              The test session you're looking for doesn't exist or may have been deleted.
            </Typography>
            <Button 
              component={Link} 
              to="/" 
              variant="contained" 
              startIcon={<HomeIcon />}
              sx={{
                borderRadius: 3,
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
              }}
            >
              Go to Home
            </Button>
          </Card>
        </Fade>
      </Container>
    );
  }

  console.log('Session being rendered:', session);
  console.log('Answers in session:', session.answers);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const renderOption = (question: Question, optionLetter: string) => {
    const questionId = question.id.toString();
    const userAnswer = session.answers[questionId];
    const hasAnswer = userAnswer !== undefined && userAnswer !== '';
    const isCorrectAnswer = question.correctAnswer === optionLetter;
    const isUserChoice = userAnswer === optionLetter;

    let sx: any = {
      display: 'flex', 
      alignItems: 'center', 
      my: 1,
      p: 2,
      borderRadius: 3,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        transform: 'translateX(2px)'
      }
    };

    let icon = null;

    if (hasAnswer) {
      if (isUserChoice) {
        // This was the user's choice
        sx = {
          ...sx,
          bgcolor: isCorrectAnswer ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)',
          borderColor: isCorrectAnswer ? '#34c759' : '#007aff',
          color: isCorrectAnswer ? '#34c759' : '#007aff',
          fontWeight: 600,
          '&::after': {
            content: '"Your answer"',
            position: 'absolute',
            right: 16,
            fontSize: '0.75rem',
            fontStyle: 'italic',
            opacity: 0.7
          },
          position: 'relative'
        };
        icon = isCorrectAnswer ? 
          <CheckCircleIcon sx={{ mr: 2, color: '#34c759' }} /> :
          <InfoIcon sx={{ mr: 2, color: '#007aff' }} />;
      } else if (isCorrectAnswer) {
        // This was the correct answer (but not chosen)
        sx = {
          ...sx,
          bgcolor: 'rgba(52, 199, 89, 0.05)',
          borderColor: 'rgba(52, 199, 89, 0.3)',
          color: '#34c759',
          '&::after': {
            content: '"Correct answer"',
            position: 'absolute',
            right: 16,
            fontSize: '0.75rem',
            fontStyle: 'italic',
            opacity: 0.7
          },
          position: 'relative'
        };
        icon = <CheckCircleIcon sx={{ mr: 2, color: '#34c759' }} />;
      }
    }

    return (
      <Box sx={sx}>
        {icon}
        <Typography>
          {optionLetter}. {question.options.find(o => o.letter === optionLetter)?.text}
        </Typography>
      </Box>
    );
  };

  const resultStats = [
    {
      label: 'Score',
      value: `${session.score?.toFixed(1) || 0}%`,
      icon: <ScoreIcon fontSize="large" />,
      color: 'primary.main'
    },
    {
      label: 'Correct Answers',
      value: `${session.correctAnswers} / ${session.questions.length}`,
      icon: <CheckListIcon fontSize="large" />,
      color: 'success.main'
    },
    {
      label: 'Time Spent',
      value: formatTime(session.totalTimeSpent),
      icon: <TimerIcon fontSize="large" />,
      color: 'info.main'
    },
    {
      label: 'Mode',
      value: <Chip label={session.mode} color="primary" sx={{ borderRadius: 2 }} />,
      icon: <InfoIcon fontSize="large" />,
      color: 'secondary.main'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Fade in timeout={300}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Avatar sx={{ 
            width: 80, 
            height: 80, 
            mx: 'auto', 
            mb: 3,
            bgcolor: 'rgba(0, 122, 255, 0.1)',
            color: '#007aff'
          }}>
            <QuizIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Test Review
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {session.mode.charAt(0).toUpperCase() + session.mode.slice(1)} Mode • {session.questions.length} Questions
          </Typography>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {resultStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Fade in timeout={400 + (index * 100)}>
              <Card sx={{ 
                height: '100%', 
                textAlign: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Avatar sx={{ 
                    width: 56, 
                    height: 56, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: `${stat.color}15`,
                    color: stat.color
                  }}>
                    {stat.icon}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Questions Section */}
      <Slide direction="up" in timeout={600}>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar sx={{ 
                bgcolor: 'rgba(0, 122, 255, 0.1)', 
                color: '#007aff',
                width: 48,
                height: 48
              }}>
                <QuizIcon />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Question Breakdown
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Detailed review of your answers
                </Typography>
              </Box>
            </Box>

            {session.questions.map((q, index) => {
              const questionId = q.id.toString();
              const userAnswer = session.answers[questionId];
              const hasAnswer = userAnswer !== undefined;
              const isCorrect = hasAnswer && userAnswer === q.correctAnswer;
              const isInCorrectHistory = correctHistory.has(q.id);
              const isInIncorrectHistory = incorrectHistory.has(q.id);
              
              return (
                <Fade key={q.id} in timeout={300 + (index * 50)}>
                  <Card sx={{ 
                    mb: 2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }
                  }}>
                    <Accordion 
                      sx={{ 
                        boxShadow: 'none',
                        '&:before': { display: 'none' },
                        bgcolor: 'transparent'
                      }}
                    >
                      <AccordionSummary 
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          bgcolor: hasAnswer 
                            ? (isCorrect ? 'rgba(52, 199, 89, 0.05)' : 'rgba(0, 122, 255, 0.05)') 
                            : 'rgba(0, 0, 0, 0.02)',
                          borderRadius: 3,
                          '&:hover': {
                            bgcolor: hasAnswer 
                              ? (isCorrect ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)') 
                              : 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                          {/* Status Avatar */}
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40,
                            bgcolor: hasAnswer 
                              ? (isCorrect ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)')
                              : 'rgba(0, 0, 0, 0.1)',
                            color: hasAnswer 
                              ? (isCorrect ? '#34c759' : '#007aff')
                              : 'text.secondary'
                          }}>
                            {hasAnswer ? (
                              isCorrect ? <CheckCircleIcon /> : <InfoIcon />
                            ) : (
                              <CancelIcon />
                            )}
                          </Avatar>

                          {/* Question Info */}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              Question {index + 1}
                            </Typography>
                            {hasAnswer ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={isCorrect ? 'Correct' : 'Incorrect'}
                                  color={isCorrect ? 'success' : 'info'}
                                  size="small"
                                  sx={{ borderRadius: 2 }}
                                />
                                <Chip 
                                  label={`Your answer: ${userAnswer}`}
                                  variant="outlined"
                                  size="small"
                                  sx={{ borderRadius: 2 }}
                                />
                                {!isCorrect && (
                                  <Chip 
                                    label={`Correct: ${q.correctAnswer}`}
                                    color="success"
                                    variant="outlined"
                                    size="small"
                                    sx={{ borderRadius: 2 }}
                                  />
                                )}
                              </Box>
                            ) : (
                              <Chip 
                                label="Skipped" 
                                size="small" 
                                sx={{ borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.1)' }} 
                              />
                            )}
                          </Box>

                          {/* History & Domain */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Tooltip
                              title={
                                isInIncorrectHistory && !isInCorrectHistory
                                  ? "Previously answered incorrectly in other tests"
                                  : isInCorrectHistory
                                  ? "Previously answered correctly in other tests"
                                  : "First time seeing this question"
                              }
                            >
                              <Avatar sx={{ 
                                width: 32, 
                                height: 32,
                                bgcolor: isInIncorrectHistory && !isInCorrectHistory
                                  ? 'rgba(0, 122, 255, 0.1)'
                                  : isInCorrectHistory
                                  ? 'rgba(52, 199, 89, 0.1)'
                                  : 'rgba(0, 0, 0, 0.05)',
                                color: isInIncorrectHistory && !isInCorrectHistory
                                  ? '#007aff'
                                  : isInCorrectHistory
                                  ? '#34c759'
                                  : 'text.disabled'
                              }}>
                                <HistoryIcon sx={{ fontSize: 16 }} />
                              </Avatar>
                            </Tooltip>
                            
                            <Chip
                              label={`Domain ${q.domain.number}`}
                              size="small"
                              sx={{ borderRadius: 2 }}
                            />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0 }}>
                        <Divider sx={{ mb: 3 }} />
                        
                        {/* Question Text */}
                        <Typography variant="h6" paragraph sx={{ fontWeight: 500, lineHeight: 1.6 }}>
                          {q.questionText}
                        </Typography>

                        {/* Options */}
                        <Box sx={{ my: 3 }}>
                          {q.options.map(opt => renderOption(q, opt.letter))}
                        </Box>

                        {!hasAnswer && (
                          <Alert 
                            severity="info" 
                            sx={{ 
                              my: 3,
                              borderRadius: 2,
                              bgcolor: 'rgba(0, 122, 255, 0.05)',
                              border: '1px solid rgba(0, 122, 255, 0.2)'
                            }}
                          >
                            You skipped this question in this test session.
                          </Alert>
                        )}

                        <Divider sx={{ my: 3 }} />
                        
                        {/* Explanation */}
                        <Card sx={{ 
                          bgcolor: 'rgba(0, 122, 255, 0.02)',
                          border: '1px solid rgba(0, 122, 255, 0.1)'
                        }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                              Explanation:
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                              {q.explanation}
                            </Typography>
                          </CardContent>
                        </Card>
                      </AccordionDetails>
                    </Accordion>
                  </Card>
                </Fade>
              );
            })}
          </CardContent>
        </Card>
      </Slide>

      {/* Action Buttons */}
      <Fade in timeout={800}>
        <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Button 
            variant="contained" 
            component={Link} 
            to="/"
            startIcon={<HomeIcon />}
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
            Back to Home
          </Button>
          <Button 
            variant="outlined" 
            component={Link} 
            to="/progress"
            startIcon={<TrendingUpIcon />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            View Progress
          </Button>
        </Box>
      </Fade>
    </Container>
  );
};

export default TestResult; 