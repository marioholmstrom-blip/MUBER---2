// MUBER Design Tokens
// Centraliza colores, radios, sombras, tipografías y breakpoints
// Basado en estilos existentes en HomeScreen, UserScreen, DriverScreen, etc.

export const colors = {
  // Primary colors (dark theme)
  primary: {
    DEFAULT: "#1f2d3a",
    dark: "#10243e",
    light: "#22313f",
  },

  // Secondary colors (orange accent)
  secondary: {
    DEFAULT: "#e67e22",
    dark: "#d35400",
    light: "#f39c12",
  },

  // Neutral colors
  neutral: {
    50: "#f8fbff",
    100: "#eef3f7",
    200: "#dbe5ef",
    300: "#d7dde5",
    400: "#d0d9e3",
    500: "#44566c",
    600: "#5f6c79",
    700: "#4f637d",
    800: "#2c3e50",
    900: "#17314f",
    950: "#10243e",
  },

  // Semantic colors
  success: {
    bg: "#e8f7ef",
    border: "#a7e0c0",
    text: "#0f3a24",
  },
  warning: {
    bg: "#fff7ef",
    border: "#f0d2b2",
    text: "#7a3e00",
  },
  danger: {
    bg: "#fff1f0",
    border: "#f0b8b2",
    text: "#8a1f12",
  },
  info: {
    bg: "#e8f2fb",
    border: "#b9d4ef",
    text: "#0f2740",
  },

  // Text colors
  text: {
    primary: "#10243e",
    secondary: "#44566c",
    tertiary: "#5f6c79",
    inverse: "#ffffff",
  },

  // Background colors
  bg: {
    primary: "#ffffff",
    secondary: "#eef3f7",
    tertiary: "#f8fbff",
  },
};

export const borderRadius = {
  sm: 12,
  DEFAULT: 14,
  md: 16,
  lg: 18,
  xl: 20,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  "4xl": 32,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 13,
  base: 14,
  md: 15,
    lg: 16,
    xl: 17,
  "2xl": 20,
  "3xl": 21,
  "4xl": 22,
  "5xl": 24,
  "6xl": 26,
  "7xl": 28,
  "8xl": 32,
  },
  fontWeight: {
    normal: "400",
  medium: "600",
  semibold: "700",
  bold: "800",
  extrabold: "900",
  },
  lineHeight: {
    tight: 18,
  normal: 20,
  relaxed: 22,
  },
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1200,
};

export const maxWidth = {
  mobile: 480,
  tablet: 768,
  desktop: 980,
  wide: 1200,
};

// Helper function to get responsive value based on breakpoint
export const responsive = (value, windowWidth) => {
  if (windowWidth >= breakpoints.desktop) return value.desktop || value.tablet || value.mobile || value;
  if (windowWidth >= breakpoints.tablet) return value.tablet || value.mobile || value;
  if (windowWidth >= breakpoints.mobile) return value.mobile || value;
  return value;
};
