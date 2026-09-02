export type Theme = "dark" | "light" | "system";

/**
 * Apply theme to document root element
 * Handles 'dark', 'light', and 'system' (prefers-color-scheme)
 */
export function applyTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }

  try {
    localStorage.setItem("analytika_theme", theme);
    document.cookie = `analytika_theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}

/**
 * Initialize system preference watcher for dynamic switching when theme is 'system'
 */
export function initThemeWatcher() {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => {
    try {
      const current = (localStorage.getItem("analytika_theme") as Theme) || "system";
      if (current === "system") {
        applyTheme("system");
      }
    } catch {}
  };

  mediaQuery.addEventListener("change", listener);
  return () => mediaQuery.removeEventListener("change", listener);
}
