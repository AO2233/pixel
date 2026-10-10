import { prefersReducedMotion } from "./motion";

export function initTitleDecrypt() {
  if (prefersReducedMotion()) {
    return;
  }

  const glyphs = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789!?#$@&%";
  const randomGlyph = () => glyphs.charAt(Math.floor(Math.random() * glyphs.length));

  document.querySelectorAll("h1.title, p.site-description").forEach((element) => {
    // Rich subtitles (links, emphasis) would lose their markup; leave them alone.
    if (element.childElementCount) {
      return;
    }
    const originalText = element.textContent.trim();
    if (!originalText) {
      return;
    }

    const characters = [...originalText];
    const maxSteps = characters.length + 8;
    const text = document.createTextNode("");
    const cursor = document.createElement("span");
    cursor.className = "decrypt-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "█";
    element.setAttribute("aria-label", originalText);
    element.replaceChildren(text, cursor);

    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      const revealed = Math.floor((step / maxSteps) * characters.length);
      text.data = characters
        .map((character, index) => (index < revealed || character === " " ? character : randomGlyph()))
        .join("");

      if (step >= maxSteps) {
        window.clearInterval(timer);
        element.textContent = originalText;
        element.removeAttribute("aria-label");
      }
    }, 48);
  });
}
