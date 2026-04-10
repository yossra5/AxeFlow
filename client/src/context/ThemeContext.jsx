// client/src/context/ThemeContext.jsx
// Provides dark/light mode + canvas background style to the whole app.
// Wrap the app with <ThemeProvider> and call useTheme() anywhere.

import React, { createContext, useContext, useState } from "react";

export const CANVAS_THEMES = [
  { id: "dark-dots",    label: "Dark Dots",    bg: "#080818", dot: "#4646b9", type: "dots"  },
  { id: "dark-lines",   label: "Dark Grid",    bg: "#080818", dot: "#1a1a3a", type: "lines" },
  { id: "midnight",     label: "Midnight",     bg: "#050510", dot: "#0f0f2a", type: "dots"  },
  { id: "slate",        label: "Slate",        bg: "#0f172a", dot: "#1e293b", type: "dots"  },
  { id: "light-dots",   label: "Light Dots",   bg: "#f8fafc", dot: "#cbd5e1", type: "dots"  },
  { id: "light-grid",   label: "Light Grid",   bg: "#f1f5f9", dot: "#e2e8f0", type: "lines" },
  { id: "warm",         label: "Warm",         bg: "#1a1208", dot: "#83622f", type: "dots"  },
  { id: "forest",       label: "Forest",       bg: "#0a1a0f", dot: "#008000", type: "dots"  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark,       setIsDark]       = useState(true);
  const [canvasTheme,  setCanvasTheme]  = useState(CANVAS_THEMES[0]);

  const toggleMode = () => setIsDark((d) => !d);

  // UI colors based on dark/light mode
  const ui = isDark ? {
    bg:          "#0a0a1a",
    surface:     "#13132a",
    surface2:    "#1a1a2e",
    border:      "#2d2d4e",
    text:        "#e8e8f0",
    textMuted:   "#666",
    textHint:    "#444",
    topbar:      "#0d0d20",
    sidebar:     "#0d0d20",
  } : {
    bg:          "#f1f5f9",
    surface:     "#ffffff",
    surface2:    "#f8fafc",
    border:      "#e2e8f0",
    text:        "#1e293b",
    textMuted:   "#64748b",
    textHint:    "#94a3b8",
    topbar:      "#ffffff",
    sidebar:     "#ffffff",
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleMode, canvasTheme, setCanvasTheme, ui, CANVAS_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
