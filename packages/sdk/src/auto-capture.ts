// Automatic SPA Navigation & Declarative HTML Data-Goal Auto-Capture

export function initSpaRouter(onPageview: (path: string) => void): () => void {
  if (typeof window === "undefined" || !window.history) {
    return () => {};
  }

  let currentPath = window.location.pathname;

  const handleRoute = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      currentPath = newPath;
      onPageview(newPath);
    }
  };

  // Monkey-patch history.pushState
  const originalPushState = window.history.pushState;
  window.history.pushState = function (...args) {
    const res = originalPushState.apply(this, args);
    handleRoute();
    return res;
  };

  // Monkey-patch history.replaceState
  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function (...args) {
    const res = originalReplaceState.apply(this, args);
    handleRoute();
    return res;
  };

  // Listen to browser Back/Forward & hash changes
  window.addEventListener("popstate", handleRoute);
  window.addEventListener("hashchange", handleRoute);

  return () => {
    window.history.pushState = originalPushState;
    window.history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", handleRoute);
    window.removeEventListener("hashchange", handleRoute);
  };
}

export function initHtmlAutoCapture(
  onGoal: (goalName: string, properties: Record<string, any>) => void
): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // Find closest element with data-goal or data-analytics
    const element = target.closest("[data-goal], [data-analytics]") as HTMLElement | null;
    if (!element) return;

    const goalName = element.getAttribute("data-goal") || element.getAttribute("data-analytics");
    if (!goalName) return;

    const valueAttr = element.getAttribute("data-goal-value") || element.getAttribute("data-value");
    const value = valueAttr ? parseFloat(valueAttr) : undefined;
    const currency = element.getAttribute("data-goal-currency") || element.getAttribute("data-currency") || "USD";

    const properties: Record<string, any> = {
      elementTag: element.tagName.toLowerCase(),
      elementText: (element.innerText || "").trim().slice(0, 100),
      ...(value !== undefined && !isNaN(value) && { value, revenue: value, currency }),
    };

    onGoal(goalName, properties);
  };

  const handleSubmit = (event: SubmitEvent) => {
    const form = event.target as HTMLFormElement | null;
    if (!form) return;

    const goalName = form.getAttribute("data-goal") || form.getAttribute("data-analytics");
    if (!goalName) return;

    const valueAttr = form.getAttribute("data-goal-value");
    const value = valueAttr ? parseFloat(valueAttr) : undefined;

    const properties: Record<string, any> = {
      elementTag: "form",
      formAction: form.action || undefined,
      formId: form.id || undefined,
      ...(value !== undefined && !isNaN(value) && { value, revenue: value }),
    };

    onGoal(goalName, properties);
  };

  document.addEventListener("click", handleClick, { capture: true, passive: true });
  document.addEventListener("submit", handleSubmit, { capture: true, passive: true });

  return () => {
    document.removeEventListener("click", handleClick, { capture: true });
    document.removeEventListener("submit", handleSubmit, { capture: true });
  };
}
