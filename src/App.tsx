import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Progress from './pages/Progress';
import Bookmarks from './pages/Bookmarks';
import Notes from './pages/Notes';
import FullExam from './pages/FullExam';
import DomainPractice from './pages/DomainPractice';
import SeenQuestions from './pages/SeenQuestions';
import UnseenQuestions from './pages/UnseenQuestions';
import TestResult from './pages/TestResult';
import appleTheme from './appleTheme';

function App() {
  return (
    <ThemeProvider theme={appleTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/full-exam" element={<FullExam />} />
          <Route path="/domain-practice" element={<DomainPractice />} />
          <Route path="/seen-questions" element={<SeenQuestions />} />
          <Route path="/unseen-questions" element={<UnseenQuestions />} />
          <Route path="/test-result/:sessionId" element={<TestResult />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 