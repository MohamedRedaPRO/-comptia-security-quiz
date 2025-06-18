import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Divider,
  Fade,
  Zoom,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ReviewsIcon from '@mui/icons-material/Reviews';
import AccessTimeIcon from '@mui/icons-material/Timer';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { TestHistoryEntry } from '../types/quiz';
import { StorageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

const TestHistory: React.FC = () => {
  const [testHistory, setTestHistory] = useState<TestHistoryEntry[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; sessionId: string | null }>({
    open: false,
    sessionId: null
  });
  const [copySnackbar, setCopySnackbar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTestHistory();
  }, []);

  const loadTestHistory = () => {
    const history = StorageService.getTestHistory();
    setTestHistory(history);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const getModeConfig = (mode: string) => {
    const configs = {
      'study': { 
        label: 'Study Mode', 
        icon: <SchoolIcon />, 
        color: '#007aff',
        bgColor: 'rgba(0, 122, 255, 0.1)'
      },
      'practice': { 
        label: 'Practice Test', 
        icon: <PlayCircleOutlineIcon />, 
        color: '#ff9500',
        bgColor: 'rgba(255, 149, 0, 0.1)'
      },
      'domain-focus': { 
        label: 'Domain Focus', 
        icon: <SecurityIcon />, 
        color: '#34c759',
        bgColor: 'rgba(52, 199, 89, 0.1)'
      },
      'review': { 
        label: 'Review Mode', 
        icon: <ReviewsIcon />, 
        color: '#af52de',
        bgColor: 'rgba(175, 82, 222, 0.1)'
      },
      'quick-quiz': { 
        label: 'Quick Quiz', 
        icon: <QuizIcon />, 
        color: '#ff3b30',
        bgColor: 'rgba(255, 59, 48, 0.1)'
      },
      'exam-simulation': { 
        label: 'Full Exam', 
        icon: <TrendingUpIcon />, 
        color: '#5856d6',
        bgColor: 'rgba(88, 86, 214, 0.1)'
      }
    };
    return configs[mode as keyof typeof configs] || configs['study'];
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#34c759'; // Green
    if (score >= 75) return '#ff9500'; // Orange
    return '#ff3b30'; // Red
  };

  const handleDeleteSession = (sessionId: string) => {
    StorageService.deleteTestSession(sessionId);
    loadTestHistory();
    setDeleteDialog({ open: false, sessionId: null });
  };

  if (testHistory.length === 0) {
    return (
      <Fade in timeout={300}>
        <Card sx={{ 
          p: 6, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.05) 0%, rgba(175, 82, 222, 0.05) 100%)'
        }}>
          <Zoom in timeout={500}>
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
          </Zoom>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
            No Test History Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            Complete your first quiz to start tracking your progress and see detailed analytics here.
          </Typography>
        </Card>
      </Fade>
    );
  }

  return (
    <Box>
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
            Test History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {testHistory.length} completed session{testHistory.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {testHistory.map((entry, index) => {
          const modeConfig = getModeConfig(entry.session.mode);
          const scoreColor = getScoreColor(entry.session.score || 0);
          
          return (
            <Grid item xs={12} key={entry.session.id}>
              <Fade in timeout={300 + (index * 100)}>
                <Card sx={{ 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      {/* Mode Icon & Info */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ 
                            bgcolor: modeConfig.bgColor,
                            color: modeConfig.color,
                            width: 48,
                            height: 48
                          }}>
                            {modeConfig.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {modeConfig.label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(entry.session.startTime)} at {formatTime(entry.session.startTime)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Score */}
                      <Grid item xs={6} sm={3} md={2}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Score
                          </Typography>
                          <Box sx={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: `${scoreColor}15`,
                            border: `2px solid ${scoreColor}30`
                          }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700,
                              color: scoreColor
                            }}>
                              {Math.round(entry.session.score || 0)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Questions */}
                      <Grid item xs={6} sm={3} md={2}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Questions
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {entry.session.questionsAnswered}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            of {entry.session.questions.length}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Duration */}
                      <Grid item xs={6} sm={3} md={2}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Duration
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {formatDuration(entry.session.totalTimeSpent)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Actions */}
                      <Grid item xs={6} sm={12} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1,
                          justifyContent: { xs: 'center', md: 'flex-end' }
                        }}>
                          <Button
                            variant="contained"
                            startIcon={<ReviewsIcon />}
                            onClick={() => navigate(`/test-result/${entry.session.id}`)}
                            sx={{
                              borderRadius: 3,
                              px: 3,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Review
                          </Button>
                          <Tooltip title="Delete Session">
                            <IconButton
                              onClick={() => setDeleteDialog({ open: true, sessionId: entry.session.id })}
                              sx={{
                                color: '#ff3b30',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 59, 48, 0.1)'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          );
        })}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, sessionId: null })}
        PaperProps={{
          sx: {
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          Delete Test Session?
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Are you sure you want to delete this test session? This action cannot be undone and all associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setDeleteDialog({ open: false, sessionId: null })}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => deleteDialog.sessionId && handleDeleteSession(deleteDialog.sessionId)}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copySnackbar}
        autoHideDuration={3000}
        onClose={() => setCopySnackbar(false)}
        message="Session data copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default TestHistory; 