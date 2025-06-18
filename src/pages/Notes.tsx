import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  Tooltip,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotesIcon from '@mui/icons-material/Notes';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { QuestionNote } from '../types/quiz';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import RichTextEditor from '../components/RichTextEditor';

const Notes: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<QuestionNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    note: QuestionNote | null;
  }>({ open: false, note: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    noteId: number | null;
  }>({ open: false, noteId: null });
  const [editContent, setEditContent] = useState('');
  const [copySnackbar, setCopySnackbar] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const allNotes = StorageService.getAllQuestionNotes();
    setNotes(allNotes.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()));
  };

  const filteredNotes = notes.filter(note => {
    const question = QuestionService.getQuestionById(note.questionId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      note.content.toLowerCase().includes(searchLower) ||
      question?.questionText.toLowerCase().includes(searchLower) ||
      question?.domain.name.toLowerCase().includes(searchLower)
    );
  });

  const handleEditNote = (note: QuestionNote) => {
    setEditContent(note.content);
    setEditDialog({ open: true, note });
  };

  const handleSaveEdit = () => {
    if (editDialog.note) {
      StorageService.addOrUpdateQuestionNote(editDialog.note.questionId, editContent);
      loadNotes();
      setEditDialog({ open: false, note: null });
      setEditContent('');
    }
  };

  const handleDeleteNote = (questionId: number) => {
    StorageService.removeQuestionNote(questionId);
    loadNotes();
    setDeleteDialog({ open: false, noteId: null });
  };

  const handleCopyQuestion = async (questionId: number) => {
    const question = QuestionService.getQuestionById(questionId);
    if (!question) return;

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  if (notes.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 2 }}>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotesIcon />
            Your Notes
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </Box>

        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotesIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notes yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add notes to questions while taking quizzes to see them here
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 2 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotesIcon />
          Your Notes ({notes.length})
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search notes by content, question text, or domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Notes Grid */}
      <Grid container spacing={3}>
        {filteredNotes.map((note) => {
          const question = QuestionService.getQuestionById(note.questionId);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={note.questionId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Chip
                      label={`Domain ${question?.domain.number || 'Unknown'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title="Copy Question">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyQuestion(note.questionId)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(note.lastModified)}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {question && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Question:
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {question.questionText}
                      </Typography>
                    </Box>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Your Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {stripHtml(note.content)}
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleEditNote(note)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteDialog({ open: true, noteId: note.questionId })}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredNotes.length === 0 && searchTerm && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No notes found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms
          </Typography>
        </Paper>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, note: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Note</DialogTitle>
        <DialogContent>
          {editDialog.note && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Question:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {QuestionService.getQuestionById(editDialog.note.questionId)?.questionText}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom>
                Your Notes:
              </Typography>
              <RichTextEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="Edit your notes..."
                minHeight={200}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, note: null })}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, noteId: null })}
      >
        <DialogTitle>Delete Note?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this note? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, noteId: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteDialog.noteId && handleDeleteNote(deleteDialog.noteId)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default Notes; 