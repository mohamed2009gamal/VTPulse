import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  const themeVars = useMemo(
    () => ({
      dark: {
        '--bg': '#000000',
        '--text': '#f1f5f9',
        '--muted': '#a1a1aa',
        '--accent': '#1e90ff',
        '--link': '#9ec1ff',
        '--linkActive': '#5b7cff',
        '--cardBg': '#0f0f12',
        '--inputBg': '#15151a',
        '--inputBorder': '#2a2a32',
        '--buttonBg': '#2563eb',
        '--sidebarBg': '#0b0b0e',
        '--sidebarBorder': '#1f1f25',
        '--hoverBg': 'rgba(255,255,255,0.08)',
        '--menuBg': 'rgba(0,0,0,0.92)',
        '--headerBg': 'rgba(0,0,0,0.4)',
        '--ring': 'rgba(30,144,255,0.35)',
        '--app-bg': 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
      },
      light: {
        '--bg': '#ffffff',
        '--text': '#0f172a',
        '--muted': '#4b5563',
        '--accent': '#1e90ff',
        '--link': '#1d4ed8',
        '--linkActive': '#1535d3',
        '--cardBg': '#ffffff',
        '--inputBg': '#f8fafc',
        '--inputBorder': '#e5e7eb',
        '--buttonBg': '#2563eb',
        '--sidebarBg': '#f5f7fb',
        '--sidebarBorder': '#e5e7eb',
        '--hoverBg': 'rgba(0,0,0,0.08)',
        '--menuBg': 'rgba(255,255,255,0.95)',
        '--headerBg': 'rgba(255,255,255,0.6)',
        '--ring': 'rgba(30,144,255,0.35)',
        '--app-bg': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)'
      }
    }),
    []
  );

  const themes = useMemo(
    () => ({
      dark: {
        bg: themeVars.dark['--bg'],
        color: themeVars.dark['--text'],
        text: themeVars.dark['--text'],
        muted: themeVars.dark['--muted'],
        textSecondary: themeVars.dark['--muted'],
        accent: themeVars.dark['--accent'],
        accentColor: themeVars.dark['--accent'],
        link: themeVars.dark['--link'],
        linkActive: themeVars.dark['--linkActive'],
        cardBg: themeVars.dark['--cardBg'],
        inputBg: themeVars.dark['--inputBg'],
        inputBorder: themeVars.dark['--inputBorder'],
        buttonBg: themeVars.dark['--buttonBg'],
        sidebarBg: themeVars.dark['--sidebarBg'],
        sidebarBorder: themeVars.dark['--sidebarBorder'],
        hoverBg: themeVars.dark['--hoverBg'],
        menuBg: themeVars.dark['--menuBg'],
        headerBg: themeVars.dark['--headerBg'],
        ring: themeVars.dark['--ring'],
        appBg: themeVars.dark['--app-bg']
      },
      light: {
        bg: themeVars.light['--bg'],
        color: themeVars.light['--text'],
        text: themeVars.light['--text'],
        muted: themeVars.light['--muted'],
        textSecondary: themeVars.light['--muted'],
        accent: themeVars.light['--accent'],
        accentColor: themeVars.light['--accent'],
        link: themeVars.light['--link'],
        linkActive: themeVars.light['--linkActive'],
        cardBg: themeVars.light['--cardBg'],
        inputBg: themeVars.light['--inputBg'],
        inputBorder: themeVars.light['--inputBorder'],
        buttonBg: themeVars.light['--buttonBg'],
        sidebarBg: themeVars.light['--sidebarBg'],
        sidebarBorder: themeVars.light['--sidebarBorder'],
        hoverBg: themeVars.light['--hoverBg'],
        menuBg: themeVars.light['--menuBg'],
        headerBg: themeVars.light['--headerBg'],
        ring: themeVars.light['--ring'],
        appBg: themeVars.light['--app-bg']
      }
    }),
    [themeVars]
  );

  const currentTheme = themes[theme] || themes.dark;

  const applyTheme = useCallback(
    (newTheme) => {
      const themeColors = themeVars[newTheme] || themeVars.dark;
      const root = document.documentElement;
      
      // Set data-theme attribute
      root.setAttribute('data-theme', newTheme);
      
      // Apply all CSS custom properties
      Object.entries(themeColors).forEach(([property, value]) => {
        root.style.setProperty(property, value);
      });

      // Force immediate background updates
      document.body.style.background = themeColors['--bg'];
      document.body.style.color = themeColors['--text'];
      root.style.background = themeColors['--app-bg'];

      // Force reflow for immediate visual update
      void document.body.offsetHeight;
      
      // Store in localStorage
      localStorage.setItem('theme', newTheme);
    },
    [themeVars]
  );

  const setThemeMode = useCallback(
    (nextTheme) => {
      const resolvedTheme = themeVars[nextTheme] ? nextTheme : 'dark';
      setTheme(resolvedTheme);
      applyTheme(resolvedTheme);
    },
    [applyTheme, themeVars]
  );

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const nextTheme = themeVars[savedTheme] ? savedTheme : 'dark';
    setThemeMode(nextTheme);
  }, [setThemeMode, themeVars]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode, themes, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
