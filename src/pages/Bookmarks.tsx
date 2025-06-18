import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Divider,
  Tooltip,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import { BookmarkedQuestion, Question, TestConfig } from '../types/quiz';

const Bookmarks: React.FC = () => {
  const navigate = useNavigate();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Array<BookmarkedQuestion & { question: Question }>>([]);
  const [copySnackbar, setCopySnackbar] = useState(false);

  useEffect(() => {
    const bookmarks = StorageService.getBookmarkedQuestions();
    const questionsWithDetails = bookmarks.map(bookmark => ({
      ...bookmark,
      question: QuestionService.getQuestionById(bookmark.questionId)!
    })).filter(item => item.question); // Filter out any questions that might not exist

    setBookmarkedQuestions(questionsWithDetails);
  }, []);

  const handleCopyQuestion = async (question: Question) => {
    const questionText = `Question: ${question.questionText}\n\nAnswer Options:\n${
      question.options.map(option => `${option.letter}. ${option.text}`).join('\n')
    }\n\nCorrect Answer: ${question.correctAnswer}\n\nDomain: ${question.domain.number} - ${question.domain.name}`;

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

  const handleRemoveBookmark = (questionId: number) => {
    StorageService.removeBookmark(questionId);
    setBookmarkedQuestions(prev => prev.filter(item => item.questionId !== questionId));
  };

  const handlePracticeBookmarks = () => {
    if (bookmarkedQuestions.length === 0) return;

    const config: TestConfig = {
      mode: 'review',
      showExplanations: true,
      shuffleQuestions: false
    };
    navigate('/quiz', { state: { config } });
  };

  const formatDate = (date: Date) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return 'Unknown';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, mt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          Back to Home
        </Button>
        <Typography variant="h4" component="h1">
          Bookmarked Questions
        </Typography>
      </Box>

      {bookmarkedQuestions.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          You haven't bookmarked any questions yet. While taking quizzes, click the bookmark icon to save questions for later review.
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {bookmarkedQuestions.length} Bookmarked Question{bookmarkedQuestions.length !== 1 ? 's' : ''}
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handlePracticeBookmarks}
            >
              Practice All Bookmarks
            </Button>
          </Box>

          <Paper>
            <List>
              {bookmarkedQuestions.map((item, index) => (
                <React.Fragment key={item.questionId}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BookmarkIcon color="primary" fontSize="small" />
                          <Chip 
                            label={`Domain ${item.question.domain.number}`} 
                            size="small" 
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Bookmarked {formatDate(item.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {item.question.questionText}
                          </Typography>
                          {item.note && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Note: {item.note}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Copy Question">
                          <IconButton
                            edge="end"
                            aria-label="copy question"
                            onClick={() => handleCopyQuestion(item.question)}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          edge="end"
                          aria-label="remove bookmark"
                          onClick={() => handleRemoveBookmark(item.questionId)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < bookmarkedQuestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}

      {/* Copy Success Snackbar */}
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

export default Bookmarks; 