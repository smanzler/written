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
    const shouldBeDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", shouldBeDark);
    return shouldBeDark;
  }

  const theme = getTheme();
  const shouldBeDark = applyTheme(theme);

  document.documentElement.style.backgroundColor = shouldBeDark
    ? "oklch(0.145 0 0)"
    : "oklch(1 0 0)";
})();
