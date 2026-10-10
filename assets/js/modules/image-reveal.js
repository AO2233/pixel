import { onMotionPreferenceChange, prefersReducedMotion } from "./motion";

export function initImageReveal() {
  const images = [...document.querySelectorAll(".zoom-image")];
  const reduceMotion = prefersReducedMotion();

  if (!images.length || reduceMotion || typeof IntersectionObserver === "undefined") {
    return;
  }

  images.forEach((image) => image.classList.add("pixel-reveal-pending"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.unobserve(entry.target);
        revealImage(entry.target);
      });
    },
    { threshold: 0 },
  );

  images.forEach((image) => {
    const observeLoadedImage = () => {
      if (image.naturalWidth) observer.observe(image);
      else image.classList.remove("pixel-reveal-pending");
    };
    if (image.complete) observeLoadedImage();
    else {
      image.addEventListener("load", observeLoadedImage, { once: true });
      image.addEventListener("error", () => {
        image.classList.remove("pixel-reveal-pending");
      }, { once: true });
    }
  });
}

function revealImage(image) {
  const showImage = () => image.classList.remove("pixel-reveal-pending");
  const startReveal = () => {
    if (prefersReducedMotion() ||
        !image.naturalWidth || !image.naturalHeight || !image.parentElement) {
      showImage();
      return;
    }

    const width = image.offsetWidth;
    const height = image.offsetHeight;
    if (!width || !height) {
      showImage();
      return;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      showImage();
      return;
    }

    const container = image.parentElement;
    container.classList.add("pixel-reveal-frame");
    canvas.className = "pixel-reveal-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.left = `${image.offsetLeft}px`;
    canvas.style.top = `${image.offsetTop}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    container.appendChild(canvas);

    const duration = 1000;
    const initialBlocks = Math.min(14, Math.max(8, Math.round(width / 42)));
    let startedAt;
    let previousWidth = 0;
    let frameId;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.cancelAnimationFrame(frameId);
      canvas.remove();
      showImage();
      if (!container.querySelector(".pixel-reveal-canvas")) {
        container.classList.remove("pixel-reveal-frame");
      }
      image.removeEventListener("medium-zoom:open", finish);
      image.removeEventListener("error", finish);
      window.removeEventListener("resize", finish);
      stopWatchingMotion();
    };
    image.addEventListener("medium-zoom:open", finish);
    image.addEventListener("error", finish);
    window.addEventListener("resize", finish, { passive: true });
    const stopWatchingMotion = onMotionPreferenceChange(finish);

    const draw = (now) => {
      if (finished) return;
      startedAt ??= now;
      const progress = Math.min((now - startedAt) / duration, 1);
      // Hold the coarse frame briefly, then halve the block size in clear steps.
      const eased = Math.max(0, (progress - 0.1) / 0.9);
      const pixelWidth = Math.min(
        width,
        Math.round(initialBlocks * Math.pow(2, Math.floor(eased * 7))),
      );

      if (pixelWidth !== previousWidth) {
        const pixelHeight = Math.max(1, Math.round(pixelWidth * (height / width)));
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        context.imageSmoothingEnabled = false;
        try {
          context.drawImage(image, 0, 0, pixelWidth, pixelHeight);
        } catch {
          finish();
          return;
        }
        previousWidth = pixelWidth;

      }

      if (progress < 1) {
        frameId = window.requestAnimationFrame(draw);
        return;
      }

      finish();
    };

    frameId = window.requestAnimationFrame(draw);
  };

  if (image.complete) {
    startReveal();
  } else {
    image.addEventListener("load", startReveal, { once: true });
    image.addEventListener("error", showImage, { once: true });
  }
}
