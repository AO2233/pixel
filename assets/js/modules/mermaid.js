// Diagrams use the theme palette (tokens.css) instead of Mermaid's defaults,
// so they follow light/dark mode like the rest of the page.
export function initMermaid() {
  if (typeof mermaid === "undefined") {
    return;
  }

  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const styles = getComputedStyle(document.documentElement);
  const token = (name) => styles.getPropertyValue(name).trim();
  const ink = token("--ink");
  const paper = token("--paper");
  const paper2 = token("--paper-2");
  const accent = token("--accent");
  const accent2 = token("--accent-2");
  const rule = token("--rule");

  mermaid.initialize({
    startOnLoad: true,
    securityLevel: "loose",
    theme: "base",
    // Mermaid 8.13 drops themeVariables when a top-level fontFamily is set,
    // so the font goes in here instead.
    themeVariables: {
      fontFamily: token("--font-body") || "inherit",
      darkMode: colorScheme.matches,
      background: paper,
      fontSize: "14px",
      primaryColor: paper2,
      primaryTextColor: ink,
      primaryBorderColor: ink,
      secondaryColor: paper,
      tertiaryColor: paper2,
      lineColor: ink,
      textColor: ink,
      noteBkgColor: paper2,
      noteBorderColor: accent,
      noteTextColor: ink,
      actorBkg: paper2,
      actorBorder: ink,
      actorTextColor: ink,
      signalColor: ink,
      signalTextColor: ink,
      labelBoxBkgColor: paper2,
      labelBoxBorderColor: ink,
      loopTextColor: ink,
      taskBkgColor: paper2,
      taskBorderColor: ink,
      taskTextColor: ink,
      taskTextOutsideColor: ink,
      activeTaskBkgColor: accent2,
      activeTaskBorderColor: ink,
      doneTaskBkgColor: rule,
      doneTaskBorderColor: ink,
      critBkgColor: accent,
      critBorderColor: ink,
      gridColor: rule,
      sectionBkgColor: paper2,
      altSectionBkgColor: paper,
      todayLineColor: accent,
      pie1: accent,
      pie2: accent2,
      pie3: rule,
      pieStrokeColor: ink,
      pieOuterStrokeColor: ink,
      pieTitleTextColor: ink,
      pieSectionTextColor: paper,
      pieLegendTextColor: ink,
    },
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "linear",
    },
    sequence: {
      actorFontFamily: token("--font-body"),
      messageFontFamily: token("--font-body"),
      noteFontFamily: token("--font-body"),
    },
  });

  colorScheme.addEventListener("change", () => window.location.reload());
}
