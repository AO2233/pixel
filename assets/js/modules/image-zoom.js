export function initImageZoom() {
  const images = document.querySelectorAll(".zoom-image");
  if (images.length && typeof mediumZoom !== "undefined") {
    mediumZoom(images, {
      background: "rgba(0, 0, 0, 0.7)",
      margin: 0,
    });
  }
}
