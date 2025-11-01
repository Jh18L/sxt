import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h2: {
      fontSize: '2rem',
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.125rem',
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      '@media (max-width:600px)': {
        fontSize: '0.9375rem',
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '12px 28px',
          fontWeight: 500,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '@media (max-width:600px)': {
            padding: '10px 20px',
            fontSize: '0.875rem',
          },
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
        sizeSmall: {
          padding: '8px 16px',
          '@media (max-width:600px)': {
            padding: '6px 12px',
            fontSize: '0.8125rem',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
            },
          },
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

export default theme;
