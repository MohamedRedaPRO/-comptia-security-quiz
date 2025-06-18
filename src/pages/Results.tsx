import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Question, QuizState } from '../types/quiz';

interface LocationState {
  quizState: QuizState;
  questions: Question[];
}

const Results: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizState, questions } = location.state as LocationState;
  const [expandedQuestion, setExpandedQuestion] = useState<number | false>(false);

  const calculateScore = () => {
    let correctAnswers = 0;
    Object.entries(quizState.answers).forEach(([index, answer]) => {
      if (questions[parseInt(index)].correctAnswer === answer) {
        correctAnswers++;
      }
    });

    const percentage = (correctAnswers / questions.length) * 100;
    const scaledScore = 100 + (percentage / 100) * 800;
    const passed = scaledScore >= 750;

    return {
      correctAnswers,
      totalQuestions: questions.length,
      percentage,
      scaledScore: Math.round(scaledScore),
      passed,
    };
  };

  const score = calculateScore();

  const handleAccordionChange = (questionIndex: number) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedQuestion(isExpanded ? questionIndex : false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Exam Results
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Score Summary
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography>
                  Correct Answers: {score.correctAnswers} / {score.totalQuestions}
                </Typography>
                <Typography>
                  Percentage: {score.percentage.toFixed(1)}%
                </Typography>
                <Typography>
                  Scaled Score: {score.scaledScore} / 900
                </Typography>
                <Alert
                  severity={score.passed ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  {score.passed
                    ? 'Congratulations! You have passed the exam.'
                    : 'You did not pass the exam. Keep studying!'}
                </Alert>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Domain Performance
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Array.from(new Set(questions.map((q) => q.domain.number))).map(
                  (domainNumber) => {
                    const domainQuestions = questions.filter(
                      (q) => q.domain.number === domainNumber
                    );
                    const domainCorrect = domainQuestions.filter(
                      (q, index) =>
                        quizState.answers[index] === q.correctAnswer
                    ).length;
                    const domainPercentage =
                      (domainCorrect / domainQuestions.length) * 100;

                    return (
                      <Box key={domainNumber} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1">
                          Domain {domainNumber}: {domainQuestions[0].domain.name}
                        </Typography>
                        <Typography>
                          {domainCorrect} / {domainQuestions.length} correct (
                          {domainPercentage.toFixed(1)}%)
                        </Typography>
                        <Chip
                          label={
                            domainPercentage >= 90
                              ? 'Ready'
                              : domainPercentage >= 70
                              ? 'Needs Review'
                              : 'Needs Focus'
                          }
                          color={
                            domainPercentage >= 90
                              ? 'success'
                              : domainPercentage >= 70
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    );
                  }
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h5" gutterBottom>
          Question Review
        </Typography>

        {questions.map((question, index) => (
          <Accordion
            key={index}
            expanded={expandedQuestion === index}
            onChange={handleAccordionChange(index)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography sx={{ flexGrow: 1 }}>
                  Question {index + 1}
                </Typography>
                <Chip
                  label={
                    quizState.answers[index] === question.correctAnswer
                      ? 'Correct'
                      : 'Incorrect'
                  }
                  color={
                    quizState.answers[index] === question.correctAnswer
                      ? 'success'
                      : 'error'
                  }
                  size="small"
                  sx={{ mr: 2 }}
                />
                {quizState.flaggedQuestions.has(index) && (
                  <Chip
                    label="Flagged"
                    color="warning"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>{question.questionText}</Typography>
              <Box sx={{ mb: 2 }}>
                {question.options.map((option) => (
                  <Typography
                    key={option.letter}
                    sx={{
                      color:
                        option.letter === question.correctAnswer
                          ? 'success.main'
                          : option.letter === quizState.answers[index] &&
                            option.letter !== question.correctAnswer
                          ? 'error.main'
                          : 'text.primary',
                      fontWeight:
                        option.letter === question.correctAnswer ||
                        option.letter === quizState.answers[index]
                          ? 'bold'
                          : 'normal',
                    }}
                  >
                    {option.letter}. {option.text}
                  </Typography>
                ))}
              </Box>
              <Typography variant="subtitle1" gutterBottom>
                Explanation:
              </Typography>
              <Typography>{question.explanation}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/full-exam')}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Results; 