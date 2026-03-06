import { StyleSheet } from 'react-native-unistyles';

const theme = {
  colors: {
    background: '#F0F2F5',
    red: '#E53935',
    green: '#4CAF50',
    blue: '#1E88E5',
    orange: '#FB8C00',
    white: '#FFFFFF',
    lightGray: '#F5F5F5',
    textPrimary: '#1A1A1A',
    textSecondary: '#757575',
    tabBar: '#1A1A2E',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  radius: {
    sm: 8,
    md: 16,
    lg: 20,
    full: 9999,
  },
  typography: {
    greeting: 28,
    sectionTitle: 18,
    alertTitle: 22,
    value: 38,
    unit: 16,
    value2: 20,
    body: 15,
    label: 13,
    small: 11,
    tab: 11,
  },
};

const appThemes = { default: theme };

type AppThemes = typeof appThemes;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: appThemes,
  settings: {
    initialTheme: 'default',
  },
});
