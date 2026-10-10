import { prefersReducedMotion } from "./motion";

// The keycap appears once the reader is a screen away from the top.
export function initPageTop() {
  const button = document.querySelector(".page-top");
  if (!button) {
    return;
  }

  let ticking = false;
  const update = () => {
    button.hidden = window.scrollY < window.innerHeight;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });

  update();
}
