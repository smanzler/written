(function () {
  const storageKey = "vite-ui-theme";
  const defaultTheme = "system";

  function getTheme() {
    try {
      return localStorage.getItem(storageKey) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }

  const theme = getTheme();
  applyTheme(theme);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.style.backgroundColor = isDark
    ? "oklch(0.145 0 0)"
    : "oklch(1 0 0)";
})();
