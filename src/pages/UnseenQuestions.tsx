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
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Question } from '../types/quiz';
import { QuestionService } from '../services/questionService';

const UnseenQuestions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unseenQuestions, setUnseenQuestions] = useState<Question[]>([]);
  const [expanded, setExpanded] = useState<number | false>(false);
  const [domain, setDomain] = useState<number | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const domainParam = searchParams.get('domain');
    const domainNumber = domainParam ? parseInt(domainParam) : null;
    
    setDomain(domainNumber);
    
    const questions = QuestionService.getUnseenQuestions(domainNumber ?? undefined);
    setUnseenQuestions(questions);
  }, [location.search]);

  const domainName = domain && unseenQuestions.length > 0
    ? QuestionService.getDomains().find(d => d.number === domain)?.name
    : null;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Unseen Questions
          {domainName && `: ${domainName}`}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Here are the questions you have not yet encountered.
        </Typography>

        <Button
          variant="outlined"
          onClick={() => navigate('/domain-practice')}
          sx={{ mb: 3 }}
        >
          Back to Domain Practice
        </Button>

        <Paper>
          <List>
            {unseenQuestions.map((question, index) => (
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
                {index < unseenQuestions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
        {unseenQuestions.length === 0 && (
          <Typography sx={{ mt: 3, textAlign: 'center' }}>
            No unseen questions found. Great job!
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default UnseenQuestions; 