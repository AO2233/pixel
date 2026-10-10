const query = window.matchMedia("(prefers-reduced-motion: reduce)");

export function prefersReducedMotion() {
  return query.matches;
}

export function onMotionPreferenceChange(callback) {
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
