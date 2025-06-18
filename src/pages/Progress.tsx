import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { StorageService } from '../services/storageService';
import { QuestionService } from '../services/questionService';
import { UserProgress, DomainProgress } from '../types/quiz';
import TestHistory from '../components/TestHistory';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [domainStats, setDomainStats] = useState<Array<DomainProgress & { name: string }>>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const progress = StorageService.getUserProgress();
    setUserProgress(progress);

    // Get domain information
    const domains = QuestionService.getDomains();
    const stats = domains.map(domain => {
      const domainProgress = progress.domainProgress[domain.number];
      
      // Ensure lastAttempted is a proper Date object
      let lastAttempted = new Date(0); // Default to epoch time
      if (domainProgress?.lastAttempted) {
        const attemptedDate = new Date(domainProgress.lastAttempted);
        if (!isNaN(attemptedDate.getTime())) {
          lastAttempted = attemptedDate;
        }
      }
      
      return {
        domainNumber: domain.number,
        totalQuestions: domainProgress?.totalQuestions || 0,
        attemptedQuestions: domainProgress?.attemptedQuestions || 0,
        correctAnswers: domainProgress?.correctAnswers || 0,
        accuracy: domainProgress?.accuracy || 0,
        averageTimePerQuestion: domainProgress?.averageTimePerQuestion || 0,
        lastAttempted,
        name: domain.name
      };
    });
    setDomainStats(stats);
  }, []);

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime()) || date.getTime() === 0) {
      return 'Never';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatTime = (seconds: number) => {
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

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 85) return 'success';
    if (accuracy >= 75) return 'warning';
    return 'error';
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!userProgress) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6">Loading progress...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, mt: 2 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon />
          Your Progress
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="progress tabs">
          <Tab 
            label="Overview & Stats" 
            icon={<AssessmentIcon />} 
            iconPosition="start"
            id="progress-tab-0"
            aria-controls="progress-tabpanel-0"
          />
          <Tab 
            label="Test History" 
            icon={<HistoryIcon />} 
            iconPosition="start"
            id="progress-tab-1"
            aria-controls="progress-tabpanel-1"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Overall Progress */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Overall Statistics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {userProgress.totalQuestionsAttempted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questions Attempted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {userProgress.overallAccuracy.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Accuracy
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {formatTime(userProgress.totalTimeSpent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Study Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {userProgress.studyStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Study Streak
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Domain Performance */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Domain Performance
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Domain</TableCell>
                  <TableCell align="center">Progress</TableCell>
                  <TableCell align="center">Accuracy</TableCell>
                  <TableCell align="center">Avg. Time</TableCell>
                  <TableCell align="center">Last Attempted</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {domainStats.map((domain) => (
                  <TableRow key={domain.domainNumber}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          Domain {domain.domainNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {domain.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ minWidth: 120 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {domain.attemptedQuestions} attempted
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={domain.totalQuestions > 0 ? (domain.attemptedQuestions / domain.totalQuestions) * 100 : 0}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {domain.attemptedQuestions > 0 ? (
                        <Chip
                          label={`${domain.accuracy.toFixed(1)}%`}
                          color={getAccuracyColor(domain.accuracy)}
                          size="small"
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {domain.averageTimePerQuestion > 0 
                          ? `${Math.round(domain.averageTimePerQuestion)}s`
                          : '-'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatDate(domain.lastAttempted)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Weak and Strong Areas */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="error">
                Areas for Improvement
              </Typography>
              {userProgress.weakAreas.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userProgress.weakAreas.map(domainNum => {
                    const domain = domainStats.find(d => d.domainNumber === domainNum);
                    return (
                      <Chip
                        key={domainNum}
                        label={`Domain ${domainNum}${domain ? `: ${domain.name}` : ''}`}
                        color="error"
                        variant="outlined"
                        size="small"
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Complete more questions to identify weak areas
                </Typography>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                Strong Areas
              </Typography>
              {userProgress.strongAreas.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userProgress.strongAreas.map(domainNum => {
                    const domain = domainStats.find(d => d.domainNumber === domainNum);
                    return (
                      <Chip
                        key={domainNum}
                        label={`Domain ${domainNum}${domain ? `: ${domain.name}` : ''}`}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Complete more questions to identify strong areas
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TestHistory />
      </TabPanel>
    </Container>
  );
};

export default Progress; 