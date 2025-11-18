import { create } from "zustand";
import {
  applyTheme,
  getInitialTheme,
  getResolvedTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

type ThemeStoreState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

let systemThemeHandler: ((e: MediaQueryListEvent) => void) | null = null;

export const useThemeStore = create<ThemeStoreState>((set, get) => {
  const initialTheme = getInitialTheme(THEME_STORAGE_KEY);

  if (typeof window !== "undefined" && initialTheme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    systemThemeHandler = () => {
      const currentTheme = get().theme;
      if (currentTheme === "system") {
        applyTheme("system", document.documentElement);
      }
    };
    mediaQuery.addEventListener("change", systemThemeHandler);
  }

  return {
    theme: initialTheme,
    setTheme: (theme: Theme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        applyTheme(theme, document.documentElement);

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        if (systemThemeHandler) {
          mediaQuery.removeEventListener("change", systemThemeHandler);
          systemThemeHandler = null;
        }

        if (theme === "system") {
          systemThemeHandler = () => {
            const currentTheme = get().theme;
            if (currentTheme === "system") {
              applyTheme("system", document.documentElement);
            }
          };
          mediaQuery.addEventListener("change", systemThemeHandler);
        }
      }
      set({ theme });
    },
  };
});

export function useResolvedTheme(): "dark" | "light" {
  const theme = useThemeStore((state) => state.theme);
  return getResolvedTheme(theme);
}
