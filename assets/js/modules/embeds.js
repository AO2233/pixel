// Shortcodes render inert placeholders with a JSON `data-*` config; the vendor
// libraries are loaded (deferred, before this bundle) only on pages that use them.

function readConfig(element, attribute) {
  try {
    return JSON.parse(element.getAttribute(attribute) || "{}");
  } catch {
    return {};
  }
}

function initAPlayers() {
  if (typeof APlayer === "undefined") {
    return;
  }

  document.querySelectorAll("[data-aplayer]").forEach((element) => {
    const { fixed = false, autoplay = false, audio } = readConfig(element, "data-aplayer");
    // Keep fixed players outside article/layout containers. Mobile Safari can
    // otherwise include their fixed descendants in the document's scrollable
    // overflow and create a large blank area below the page.
    if (fixed && element.parentNode !== document.body) {
      document.body.appendChild(element);
    }
    new APlayer({ container: element, fixed, autoplay, audio: [audio] });
  });
}

function initDPlayers() {
  if (typeof DPlayer === "undefined") {
    return;
  }

  document.querySelectorAll("[data-dplayer]").forEach((element) => {
    const { url } = readConfig(element, "data-dplayer");
    new DPlayer({
      container: element,
      screenshot: true,
      airplay: true,
      chromecast: true,
      preload: "auto",
      video: { url },
    });
  });
}

function initPDFs() {
  if (typeof PDFObject === "undefined") {
    return;
  }

  document.querySelectorAll("[data-pdf]").forEach((element) => {
    const { src } = readConfig(element, "data-pdf");
    PDFObject.embed(src, element, {
      height: "100%",
      // Fit the page to the viewer's width instead of the whole page.
      pdfOpenParams: { view: "FitH" },
      fallbackLink: "<p>The browser does not support embedded <a href='[url]'>PDF</a> documents.</p>",
    });
  });
}

export function initEmbeds() {
  initAPlayers();
  initDPlayers();
  initPDFs();
}
