export type Theme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "vite-ui-theme";

/**
 * Gets the resolved theme (dark or light) from a theme preference.
 * If theme is "system", returns the system preference.
 */
export function getResolvedTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

/**
 * Applies a theme to the document root element.
 */
export function applyTheme(theme: Theme, root: HTMLElement) {
  root.classList.remove("light", "dark");
  const resolvedTheme = getResolvedTheme(theme);
  root.classList.add(resolvedTheme);
}

/**
 * Gets the initial theme from localStorage.
 */
export function getInitialTheme(storageKey: string = THEME_STORAGE_KEY): Theme {
  if (typeof window === "undefined") return "system";
  try {
    return (localStorage.getItem(storageKey) as Theme) || "system";
  } catch {
    return "system";
  }
}
