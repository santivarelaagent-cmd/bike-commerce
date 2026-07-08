"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "forest" | "cyberpunk" | "vintage";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark"); // default server fallback

  useEffect(() => {
    // Read persisted theme from localStorage or default to dark
    const storedTheme = localStorage.getItem("mango-theme") as Theme;
    if (storedTheme && ["light", "dark", "forest", "cyberpunk", "vintage"].includes(storedTheme)) {
      setThemeState(storedTheme);
      applyTheme(storedTheme);
    } else {
      // Default to dark
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;

    // Remove existing theme data-attributes
    root.setAttribute("data-theme", newTheme);

    // Toggle .dark class for backwards compatibility/fallback support
    if (newTheme === "dark" || newTheme === "forest" || newTheme === "cyberpunk" || newTheme === "vintage") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("mango-theme", newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
