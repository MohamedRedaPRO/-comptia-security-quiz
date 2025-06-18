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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import TimerIcon from '@mui/icons-material/Timer';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ReviewsIcon from '@mui/icons-material/Reviews';
import QuizIcon from '@mui/icons-material/Quiz';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotesIcon from '@mui/icons-material/Notes';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import { TestConfig, TestMode, UserProgress } from '../types/quiz';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [configDialog, setConfigDialog] = useState<{ open: boolean; mode: TestMode | null }>({
    open: false,
    mode: null
  });
  const [testConfig, setTestConfig] = useState<TestConfig>({
    mode: 'study',
    questionCount: 20,
    timeLimit: 30,
    showExplanations: true,
    shuffleQuestions: true,
    shuffleOptions: false,
    domainNumbers: []
  });

  useEffect(() => {
    const progress = StorageService.getUserProgress();
    console.log('Home component - User progress loaded:', progress); // Debug log
    setUserProgress(progress);
  }, []);

  const handleTestModeSelect = (mode: TestMode) => {
    if (mode === 'exam-simulation') {
      navigate('/full-exam');
    } else if (mode === 'domain-focus') {
      navigate('/domain-practice');
    } else if (mode === 'study') {
      const config: TestConfig = { mode, showExplanations: true, shuffleQuestions: false };
      navigate('/quiz', { state: { config } });
    } else {
      setTestConfig(prev => ({ ...prev, mode }));
      setConfigDialog({ open: true, mode });
    }
  };

  const handleStartTest = () => {
    setConfigDialog({ open: false, mode: null });
    navigate('/quiz', { state: { config: testConfig } });
  };

  const domains = QuestionService.getDomains();

  const testModes = [
    {
      mode: 'study' as TestMode,
      title: 'Study Mode',
      description: 'Learn with immediate feedback and explanations',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2'
    },
    {
      mode: 'practice' as TestMode,
      title: 'Practice Test',
      description: 'Timed practice with results at the end',
      icon: <TimerIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02'
    },
    {
      mode: 'domain-focus' as TestMode,
      title: 'Domain Focus',
      description: 'Focus on specific domains or weak areas',
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32'
    },
    {
      mode: 'review' as TestMode,
      title: 'Review Mode',
      description: 'Review incorrect answers and bookmarked questions',
      icon: <ReviewsIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0'
    },
    {
      mode: 'quick-quiz' as TestMode,
      title: 'Quick Quiz',
      description: 'Short random quiz for daily practice',
      icon: <QuizIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f'
    },
    {
      mode: 'exam-simulation' as TestMode,
      title: 'Full Exam',
      description: 'Full 90-question exam with strict timing',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#7b1fa2'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          CompTIA Security+ SY0-701
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Practice Test Platform
        </Typography>
      </Box>

      {/* Progress Overview - Always show, even with zero values */}
      {userProgress && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Progress
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {userProgress.totalQuestionsAttempted || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Questions Attempted
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {userProgress.totalQuestionsAttempted > 0 ? userProgress.overallAccuracy.toFixed(1) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Accuracy
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {userProgress.studyStreak || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Day Streak
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {Math.floor((userProgress.totalTimeSpent || 0) / 3600)}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time Studied
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Weak Areas */}
          {userProgress.weakAreas && userProgress.weakAreas.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Areas to Focus On:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {userProgress.weakAreas.map(domainNum => {
                  const domain = domains.find(d => d.number === domainNum);
                  return (
                    <Chip 
                      key={domainNum}
                      label={`Domain ${domainNum}: ${domain?.name || 'Unknown'}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Test Modes */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Choose Your Study Mode
      </Typography>
      
      <Grid container spacing={3}>
        {testModes.map((testMode) => (
          <Grid item xs={12} sm={6} md={4} key={testMode.mode}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleTestModeSelect(testMode.mode)}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ color: testMode.color, mb: 2 }}>
                  {testMode.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {testMode.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {testMode.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<BookmarkIcon />}
          onClick={() => navigate('/bookmarks')}
        >
          View Bookmarks
        </Button>
        <Button
          variant="outlined"
          startIcon={<NotesIcon />}
          onClick={() => navigate('/notes')}
        >
          My Notes
        </Button>
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={() => navigate('/seen-questions')}
        >
          Seen Questions
        </Button>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => navigate('/progress')}
        >
          Test History
        </Button>
      </Box>

      {/* Configuration Dialog */}
      <Dialog open={configDialog.open} onClose={() => setConfigDialog({ open: false, mode: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          Configure {testModes.find(tm => tm.mode === configDialog.mode)?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Questions"
                  type="number"
                  value={testConfig.questionCount || ''}
                  onChange={(e) => setTestConfig(prev => ({ 
                    ...prev, 
                    questionCount: parseInt(e.target.value) || undefined 
                  }))}
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Time Limit (minutes)"
                  type="number"
                  value={testConfig.timeLimit || ''}
                  onChange={(e) => setTestConfig(prev => ({ 
                    ...prev, 
                    timeLimit: parseInt(e.target.value) || undefined 
                  }))}
                  inputProps={{ min: 1, max: 180 }}
                />
              </Grid>
              
              {configDialog.mode !== 'domain-focus' && configDialog.mode !== 'exam-simulation' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Select Domains</InputLabel>
                    <Select
                      multiple
                      value={testConfig.domainNumbers || []}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        domainNumbers: e.target.value as number[] 
                      }))}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((value) => (
                            <Chip key={value} label={`Domain ${value}`} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {domains.map((domain) => (
                        <MenuItem key={domain.number} value={domain.number}>
                          Domain {domain.number}: {domain.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={testConfig.showExplanations || false}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        showExplanations: e.target.checked 
                      }))}
                    />
                  }
                  label="Show explanations immediately"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={testConfig.shuffleQuestions || false}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        shuffleQuestions: e.target.checked 
                      }))}
                    />
                  }
                  label="Shuffle questions"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={testConfig.shuffleOptions || false}
                      onChange={(e) => setTestConfig(prev => ({ 
                        ...prev, 
                        shuffleOptions: e.target.checked 
                      }))}
                    />
                  }
                  label="Shuffle answer options"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Question Prioritization</InputLabel>
                  <Select
                    value={testConfig.questionPriority || 'mix'}
                    label="Question Prioritization"
                    onChange={e => setTestConfig(prev => ({
                      ...prev,
                      questionPriority: e.target.value as 'wrong' | 'new' | 'mix'
                    }))}
                  >
                    <MenuItem value="wrong">Prioritize questions I got wrong</MenuItem>
                    <MenuItem value="new">Prioritize new questions</MenuItem>
                    <MenuItem value="mix">Mix (balanced)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog({ open: false, mode: null })}>
            Cancel
          </Button>
          <Button onClick={handleStartTest} variant="contained">
            Start Test
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Home; 