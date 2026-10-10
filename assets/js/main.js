import { initEmbeds } from "./modules/embeds";
import { initImageReveal } from "./modules/image-reveal";
import { initImageZoom } from "./modules/image-zoom";
import { initMermaid } from "./modules/mermaid";
import { initSpine } from "./modules/spine";
import { initTableOfContents } from "./modules/toc";
import { initTitleDecrypt } from "./modules/title-decrypt";

// Mermaid must be configured before its own DOMContentLoaded auto-render.
initMermaid();

document.addEventListener("DOMContentLoaded", () => {
  initEmbeds();
  initImageReveal();
  initImageZoom();
  initSpine();
  initTableOfContents();
  initTitleDecrypt();
});
