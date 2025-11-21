export type Theme = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "journal-theme";

/**
 * Applies a theme to the document root element.
 */
export function applyTheme(theme: Theme, root: HTMLElement) {
  const shouldBeDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", shouldBeDark);
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
