import { createTheme } from '@mui/material/styles';

const appleTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007aff',
    },
    secondary: {
      main: '#ff3b30',
    },
    background: {
      default: '#f2f2f7',
      paper: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#6e6e73',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
        styleOverrides: {
          root: {
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          },
        },
      },
  },
});

export default appleTheme; 