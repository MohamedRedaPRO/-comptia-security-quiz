import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { Question, QuizState } from '../types/quiz';
import { QuestionService } from '../services/questionService';
import { StorageService } from '../services/storageService';

const EXAM_DURATION = 90 * 60; // 90 minutes in seconds
const TOTAL_QUESTIONS = 90;

const FullExam: React.FC = () => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExamSubmit = useCallback(() => {
    const quizState: QuizState = {
      currentQuestionIndex,
      answers,
      flaggedQuestions,
      timeRemaining,
      isSubmitted: true,
    };
    // Navigate to results page with state
    navigate('/results', { state: { quizState, questions } });
  }, [currentQuestionIndex, answers, flaggedQuestions, timeRemaining, navigate, questions]);

  useEffect(() => {
    if (questions[currentQuestionIndex]) {
      StorageService.addSeenQuestion(questions[currentQuestionIndex].id);
    }
  }, [currentQuestionIndex, questions]);

  useEffect(() => {
    // Load random questions for the exam
    const examQuestions = QuestionService.getRandomQuestions(TOTAL_QUESTIONS);
    setQuestions(examQuestions);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExamSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleExamSubmit]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const toggleFlagQuestion = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <Typography>Loading exam questions...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Grid container spacing={3}>
          {/* Question Navigation */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Time Remaining: {formatTime(timeRemaining)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Questions Answered: {Object.keys(answers).length} / {TOTAL_QUESTIONS}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={1}>
                  {questions.map((_, index) => (
                    <Grid item key={index}>
                      <Button
                        variant={
                          answers[index]
                            ? 'contained'
                            : flaggedQuestions.has(index)
                            ? 'outlined'
                            : 'text'
                        }
                        color={
                          answers[index]
                            ? 'primary'
                            : flaggedQuestions.has(index)
                            ? 'warning'
                            : 'inherit'
                        }
                        onClick={() => handleQuestionNavigation(index)}
                        sx={{ minWidth: '40px' }}
                      >
                        {index + 1}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={() => setShowConfirmDialog(true)}
                >
                  Submit Exam
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Question Display */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Question {currentQuestionIndex + 1} of {TOTAL_QUESTIONS}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Domain {questions[currentQuestionIndex]?.domain.number}
                  </Typography>
                  <IconButton onClick={toggleFlagQuestion} color="warning">
                    {flaggedQuestions.has(currentQuestionIndex) ? (
                      <FlagIcon />
                    ) : (
                      <FlagOutlinedIcon />
                    )}
                  </IconButton>
                </Box>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(currentQuestionIndex + 1) * (100 / TOTAL_QUESTIONS)}
                sx={{ mb: 3 }}
              />

              <Typography paragraph>
                {questions[currentQuestionIndex]?.questionText}
              </Typography>

              <FormControl component="fieldset">
                <RadioGroup
                  value={answers[currentQuestionIndex] || ''}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                >
                  {questions[currentQuestionIndex]?.options.map((option) => (
                    <FormControlLabel
                      key={option.letter}
                      value={option.letter}
                      control={<Radio />}
                      label={`${option.letter}. ${option.text}`}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleQuestionNavigation(currentQuestionIndex - 1)
                  }
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleQuestionNavigation(currentQuestionIndex + 1)
                  }
                  disabled={currentQuestionIndex === TOTAL_QUESTIONS - 1}
                >
                  Next
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>Submit Exam?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your exam? This action cannot be
            undone.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            You have answered{' '}
            {Object.keys(answers).length} out of {TOTAL_QUESTIONS} questions.
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Time remaining: {formatTime(timeRemaining)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleExamSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FullExam; 