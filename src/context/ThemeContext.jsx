import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export const getThemeTokens = (dark) => ({
  bg: dark ? "#000000" : "#ffffff",
  fg: dark ? "#ffffff" : "#000000",
  muted: dark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
  mutedMore: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)",
  border: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
  borderHover: dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)",
  card: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
  cardHover: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
  surface: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
  inputBg: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
  accent: dark ? "#7B9EFF" : "#2B4FFF",
  accentMuted: dark ? "rgba(123,158,255,0.15)" : "rgba(43,79,255,0.1)",
  accentBorder: dark ? "rgba(123,158,255,0.3)" : "rgba(43,79,255,0.25)",
  danger: dark ? "#ff6b6b" : "#e03131",
  dangerBg: dark ? "rgba(255,107,107,0.12)" : "rgba(224,49,49,0.08)",
  success: dark ? "#51cf66" : "#2f9e44",
  successBg: dark ? "rgba(81,207,102,0.12)" : "rgba(47,158,68,0.08)",
});

const ThemeContext = createContext({
  dark: true,
  setDark: () => {},
  toggleDark: () => {},
  theme: getThemeTokens(true),
});

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem("pause_theme") || localStorage.getItem("theme");
      if (stored !== null) return stored === "dark";
      return true; // Default to dark mode per Pause design system
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("pause_theme", dark ? "dark" : "light");
      localStorage.setItem("theme", dark ? "dark" : "light");
      document.documentElement.classList.toggle("dark", dark);
    } catch (e) {
      console.warn("Could not save theme preference:", e);
    }
  }, [dark]);

  const toggleDark = () => setDark((prev) => !prev);

  const theme = useMemo(() => getThemeTokens(dark), [dark]);

  const value = useMemo(
    () => ({
      dark,
      setDark,
      toggleDark,
      theme,
    }),
    [dark, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
