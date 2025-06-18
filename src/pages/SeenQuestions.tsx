import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Question, Domain } from '../types/quiz';
import { QuestionService } from '../services/questionService';

const SeenQuestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [seenQuestions, setSeenQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [expanded, setExpanded] = useState<number | false>(false);

  useEffect(() => {
    const questions = QuestionService.getSeenQuestionsLog();
    const availableDomains = QuestionService.getDomains();
    setSeenQuestions(questions);
    setDomains(availableDomains);

    const searchParams = new URLSearchParams(location.search);
    const domainParam = searchParams.get('domain');
    if (domainParam && availableDomains.some(d => d.number.toString() === domainParam)) {
      setSelectedDomain(domainParam);
    } else {
      setFilteredQuestions(questions);
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedDomain === 'all') {
      setFilteredQuestions(seenQuestions);
    } else {
      const domainNum = parseInt(selectedDomain);
      setFilteredQuestions(
        seenQuestions.filter(q => q.domain.number === domainNum)
      );
    }
  }, [selectedDomain, seenQuestions]);

  const handleDomainChange = (domainValue: string) => {
    setSelectedDomain(domainValue);
    // Update URL without navigating away
    navigate(`/seen-questions${domainValue === 'all' ? '' : `?domain=${domainValue}`}`, { replace: true });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Seen Questions
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Here are all the questions you have encountered across all quiz modes.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Domain</InputLabel>
            <Select
              value={selectedDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              label="Filter by Domain"
            >
              <MenuItem value="all">
                <em>All Domains</em>
              </MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.number} value={domain.number.toString()}>
                  Domain {domain.number}: {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Paper>
          <List>
            {filteredQuestions.map((question, index) => (
              <React.Fragment key={question.id}>
                <ListItem
                  button
                  onClick={() =>
                    setExpanded(expanded === index ? false : index)
                  }
                  alignItems="flex-start"
                >
                  <ListItemText
                    primary={`Q${index + 1}: ${question.questionText}`}
                    secondary={`Domain: ${question.domain.name}`}
                  />
                </ListItem>
                <Collapse in={expanded === index} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2, backgroundColor: 'action.hover' }}>
                    <Typography variant="subtitle2" gutterBottom>Options:</Typography>
                    <List dense>
                      {question.options.map(opt => (
                        <ListItem key={opt.letter}>
                          <ListItemText primary={`${opt.letter}. ${opt.text}`} />
                        </ListItem>
                      ))}
                    </List>
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>Correct Answer:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{question.correctAnswer}</Typography>
                    <Typography variant="subtitle2">Explanation:</Typography>
                    <Typography variant="body2">{question.explanation}</Typography>
                  </Box>
                </Collapse>
                {index < filteredQuestions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
        {filteredQuestions.length === 0 && (
          <Typography sx={{ mt: 3, textAlign: 'center' }}>
            {selectedDomain === 'all'
              ? "You haven't seen any questions yet. Start a quiz to see them here!"
              : "No seen questions found for this domain."}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default SeenQuestions; 