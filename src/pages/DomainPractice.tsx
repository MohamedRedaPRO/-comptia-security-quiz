import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Switch,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import NotesIcon from '@mui/icons-material/Notes';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import { Question, TestConfig } from '../types/quiz';
import { QuestionService } from '../services/questionService';
import { StorageService } from '../services/storageService';
import RichTextEditor from '../components/RichTextEditor';

const DomainPractice: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState<number | null>(null);
  const [domainQuestions, setDomainQuestions] = useState<Question[]>([]);
  const [seenQuestions, setSeenQuestions] = useState<Set<number>>(new Set());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [navigatorVisible, setNavigatorVisible] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const [copySnackbar, setCopySnackbar] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [customTestOpen, setCustomTestOpen] = useState(false);
  const [customTestConfig, setCustomTestConfig] = useState({
    count: 25,
    seenStatus: 'all' as 'all' | 'seen' | 'unseen',
    showExplanations: true,
  });

  const domains = QuestionService.getDomains();
  const currentQuestion = domainQuestions[currentQuestionIndex];
  
  useEffect(() => {
    const allSeen = StorageService.getSeenQuestions();
    setSeenQuestions(new Set(allSeen));
  }, []);
  
  useEffect(() => {
    if (currentQuestion) {
      const note = StorageService.getQuestionNote(currentQuestion.id);
      setCurrentNote(note?.content || '');
      setIsBookmarked(StorageService.isBookmarked(currentQuestion.id));
    } else {
      setCurrentNote('');
      setIsBookmarked(false);
    }
  }, [currentQuestion, showExplanation]);

  const handleDomainSelect = (domainNumber: number) => {
    setSelectedDomain(domainNumber);
    setLoading(true);
    
    // Load questions for selected domain
    setTimeout(() => {
      const questions = QuestionService.getQuestionsByDomain(domainNumber);
      setDomainQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswer('');
      setShowExplanation(false);
      setIsCorrect(null);
      setCorrectCount(0);
      setTotalAnswered(0);
      setLoading(false);
    }, 500);
  };

  const handleAnswerSubmit = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowExplanation(true);
    setTotalAnswered(prev => prev + 1);
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }

    // Mark question as seen only after an answer is submitted
    if (!seenQuestions.has(currentQuestion.id)) {
      StorageService.addSeenQuestion(currentQuestion.id);
      setSeenQuestions(prev => new Set(prev).add(currentQuestion.id));
    }
  };

  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
    setSelectedAnswer('');
    setShowExplanation(false);
    setIsCorrect(null);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < domainQuestions.length - 1) {
      handleQuestionNavigation(currentQuestionIndex + 1);
    } else {
      // Show completion message or restart
      alert(`Domain completed! You got ${correctCount} out of ${totalAnswered} questions correct (${((correctCount / totalAnswered) * 100).toFixed(1)}%)`);
      handleQuestionNavigation(0); // Restart
    }
  };
  
  const handleBookmarkToggle = () => {
    if (!currentQuestion) return;
    const newBookmarkState = !isBookmarked;
    setIsBookmarked(newBookmarkState);
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

  const handleCopyQuestion = async () => {
    if (!currentQuestion) return;
    const questionText = `Question: ${currentQuestion.questionText}\\n\\nAnswer Options:\\n${
      currentQuestion.options.map(option => `${option.letter}. ${option.text}`).join('\\n')
    }\\n\\nDomain: ${currentQuestion.domain.name}`;
    try {
      await navigator.clipboard.writeText(questionText);
      setCopySnackbar(true);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const currentPercentage = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0;

  const handleStartCustomTest = () => {
    const questions = QuestionService.getCustomTestQuestions(
      customTestConfig.count,
      customTestConfig.seenStatus
    );
    if (questions.length === 0) {
      alert('No questions available for this configuration.');
      return;
    }
    const testConfig: TestConfig = {
      mode: 'custom',
      questionCount: customTestConfig.count,
      questions,
      showExplanations: customTestConfig.showExplanations,
    };
    navigate('/quiz', { state: { config: testConfig } });
  };

  if (!selectedDomain) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Select a Domain
            </Typography>
            <Button variant="contained" onClick={() => setCustomTestOpen(true)}>
              Custom Test
            </Button>
          </Box>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Choose a domain to practice. The author recommends that if you can answer 90% or more of the questions for a domain correctly, you can feel safe moving on to the next chapter.
          </Typography>
          <Box sx={{ mt: 3 }}>
            {domains.map((domain) => (
              <Paper
                key={domain.number}
                sx={{
                  p: 2,
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    p: 1,
                    mb: 1,
                  }}
                  onClick={() => handleDomainSelect(domain.number)}
                >
                  <Typography variant="h6">
                    Domain {domain.number}: {domain.name}
                  </Typography>
                  <Typography color="text.secondary">
                    Weight: {domain.weight}% | {QuestionService.getQuestionsByDomain(domain.number).length} questions
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/seen-questions?domain=${domain.number}`);
                    }}
                  >
                    View Seen
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/unseen-questions?domain=${domain.number}`);
                    }}
                  >
                    View Unseen
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
        <Dialog open={customTestOpen} onClose={() => setCustomTestOpen(false)}>
          <DialogTitle>Create a Custom Test</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Number of Questions"
                type="number"
                value={customTestConfig.count}
                onChange={(e) =>
                  setCustomTestConfig({ ...customTestConfig, count: parseInt(e.target.value) || 1 })
                }
                inputProps={{ min: 1, max: 100 }}
              />
              <FormControl fullWidth>
                <InputLabel>Question Type</InputLabel>
                <Select
                  value={customTestConfig.seenStatus}
                  label="Question Type"
                  onChange={(e) =>
                    setCustomTestConfig({
                      ...customTestConfig,
                      seenStatus: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="all">All Questions</MenuItem>
                  <MenuItem value="seen">Seen Questions</MenuItem>
                  <MenuItem value="unseen">Unseen Questions</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={customTestConfig.showExplanations}
                    onChange={(e) =>
                      setCustomTestConfig({
                        ...customTestConfig,
                        showExplanations: e.target.checked,
                      })
                    }
                  />
                }
                label="Show explanations immediately"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomTestOpen(false)}>Cancel</Button>
            <Button onClick={handleStartCustomTest} variant="contained">
              Start Test
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  }

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
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={navigatorVisible ? "lg" : "md"}>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Domain {selectedDomain}: {domains.find(d => d.number === selectedDomain)?.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2">
                Progress: {currentQuestionIndex + 1} / {domainQuestions.length}
              </Typography>
              <Typography variant="body2">
                Score: {correctCount} / {totalAnswered} ({currentPercentage.toFixed(1)}%)
              </Typography>
            </Box>
            <Tooltip title={navigatorVisible ? "Hide Navigator" : "Show Navigator"}>
              <IconButton onClick={() => setNavigatorVisible(!navigatorVisible)}>
                {navigatorVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {navigatorVisible && (
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, maxHeight: '70vh', overflowY: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Questions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {domainQuestions.map((q, index) => (
                    <Button
                      key={q.id}
                      variant={seenQuestions.has(q.id) ? 'contained' : 'outlined'}
                      color={currentQuestionIndex === index ? 'primary' : 'inherit'}
                      onClick={() => handleQuestionNavigation(index)}
                      sx={{
                        minWidth: 40,
                        backgroundColor: seenQuestions.has(q.id) ? 'grey.300' : undefined,
                        color: seenQuestions.has(q.id) ? 'black' : undefined,
                      }}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
          
          <Grid item xs={12} md={navigatorVisible ? 9 : 12}>
            {currentQuestion && (
              <Paper sx={{ p: 3, mt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Question {currentQuestionIndex + 1} of {domainQuestions.length}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Copy Question">
                      <IconButton onClick={handleCopyQuestion}>
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Notes">
                      <IconButton onClick={() => setNotesExpanded(!notesExpanded)} color={currentNote ? 'primary' : 'default'}>
                        <NotesIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Bookmark">
                      <IconButton onClick={handleBookmarkToggle} color={isBookmarked ? 'primary' : 'default'}>
                        {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                <Collapse in={notesExpanded}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Your Notes</Typography>
                    <RichTextEditor
                      value={currentNote}
                      onChange={handleNoteChange}
                      placeholder="Add your notes for this question..."
                    />
                    <Divider sx={{ my: 2 }} />
                  </Box>
                </Collapse>

                <Typography paragraph>{currentQuestion.questionText}</Typography>

                <FormControl component="fieldset" sx={{ width: '100%' }}>
                  <RadioGroup
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  >
                    {currentQuestion.options.map((option) => (
                      <FormControlLabel
                        key={option.letter}
                        value={option.letter}
                        control={<Radio />}
                        label={`${option.letter}. ${option.text}`}
                        disabled={showExplanation}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                {showExplanation && (
                  <Box sx={{ mt: 3 }}>
                    <Alert
                      severity={isCorrect ? 'success' : 'error'}
                      sx={{ mb: 2 }}
                    >
                      {isCorrect
                        ? 'Correct!'
                        : `Incorrect. The correct answer is ${currentQuestion.correctAnswer}.`}
                    </Alert>
                    <Typography variant="subtitle1" gutterBottom>
                      Explanation:
                    </Typography>
                    <Typography>{currentQuestion.explanation}</Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  {!showExplanation ? (
                    <Button
                      variant="contained"
                      onClick={handleAnswerSubmit}
                      disabled={!selectedAnswer}
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleNextQuestion}>
                      {currentQuestionIndex < domainQuestions.length - 1 ? 'Next Question' : 'Restart Domain'}
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedDomain(null);
                      setDomainQuestions([]);
                    }}
                  >
                    Back to Domains
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
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

export default DomainPractice; 