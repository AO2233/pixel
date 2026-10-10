// Auto-hiding spine (left on desktop, top bar on phones).
//   hide: scrolling down away from the top
//   show: back near the top, pointer at the left edge (desktop), or
//         keyboard focus inside the spine. Scrolling up does not show it.
// The state lives on <html> as .spine-hidden so CSS can move other fixed
// furniture (the APlayer bar) along with it.
const TOP_ZONE = 80;      // always visible this close to the top
const SCROLL_DELTA = 6;   // ignore jitter smaller than this
const EDGE_ZONE = 16;     // px from the left edge that reveals the spine

export function initSpine() {
  const spine = document.querySelector(".site-spine");
  if (!spine) {
    return;
  }

  const root = document.documentElement;
  const desktop = window.matchMedia("(min-width: 1024px)");
  let lastY = window.scrollY;
  let ticking = false;

  const setHidden = (hidden) => {
    root.classList.toggle("spine-hidden", hidden);
  };

  const update = () => {
    const y = window.scrollY;
    if (y < TOP_ZONE) {
      setHidden(false);
    } else if (y > lastY + SCROLL_DELTA && !spine.contains(document.activeElement)) {
      setHidden(true);
    }
    if (Math.abs(y - lastY) > SCROLL_DELTA) {
      lastY = y;
    }
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // Desktop: bring it back when the pointer reaches the left edge.
  // It stays out until the next scroll down.
  document.addEventListener("pointermove", (event) => {
    if (desktop.matches && event.pointerType === "mouse" && event.clientX <= EDGE_ZONE) {
      setHidden(false);
    }
  }, { passive: true });
  spine.addEventListener("pointerenter", () => setHidden(false));

  spine.addEventListener("focusin", () => setHidden(false));
}
