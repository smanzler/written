import { create } from "zustand";

type Theme = "dark" | "light" | "system";

function applyTheme(theme: Theme, root: HTMLElement) {
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}

if (typeof window !== "undefined") {
  const storageKey = "vite-ui-theme";
  const defaultTheme = "system";
  const storedTheme =
    (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  applyTheme(storedTheme, document.documentElement);
}

type ThemeStoreState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "vite-ui-theme";

export const useThemeStore = create<ThemeStoreState>((set) => {
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
  };

  const initialTheme = getInitialTheme();

  if (typeof window !== "undefined") {
    applyTheme(initialTheme, document.documentElement);
  }

  return {
    theme: initialTheme,
    setTheme: (theme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme, document.documentElement);
      }
      set({ theme });
    },
  };
});
