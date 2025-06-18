# CompTIA Security+ Quiz Application

A comprehensive web-based quiz application designed to help users prepare for the CompTIA Security+ certification exam. This application provides an interactive learning experience with detailed explanations and progress tracking.

## Features

- **Multiple Quiz Modes**: Study mode, custom tests, and timed exams
- **Progress Tracking**: Detailed analytics on your performance across all domains
- **Question Bank**: Comprehensive collection of Security+ practice questions
- **Domain Coverage**: All 5 Security+ domains with weighted questions
- **Detailed Explanations**: Each question includes thorough explanations
- **Progress Analytics**: Track your strengths and weaknesses
- **Bookmark System**: Save important questions for later review
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React.js with TypeScript
- **UI Framework**: Material-UI (MUI)
- **Routing**: React Router
- **State Management**: React Hooks
- **Styling**: CSS-in-JS with MUI's sx prop
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/comptia-security-quiz.git
cd comptia-security-quiz
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # Business logic and data services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Features in Detail

### Quiz Modes

1. **Study Mode**: Learn at your own pace with immediate feedback
2. **Custom Test**: Create tests with specific question counts
3. **Timed Exam**: Simulate real exam conditions

### Progress Tracking

- Overall accuracy and performance metrics
- Domain-specific progress tracking
- Time spent on questions
- Study streak tracking
- Weak areas identification

### Question Management

- Comprehensive question bank covering all Security+ domains
- Detailed explanations for each answer
- Bookmark system for important questions
- Question history and review

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CompTIA for the Security+ certification framework
- Material-UI for the excellent component library
- React community for the amazing ecosystem

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This application is designed for educational purposes to help prepare for the CompTIA Security+ certification exam. It is not affiliated with CompTIA. 