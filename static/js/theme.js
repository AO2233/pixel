initMermaid();

document.addEventListener("DOMContentLoaded", () => {
  initAchievementSystem();
  initIcons();
  initImageZoom();
  initMath();
  initTableOfContents();
  initTitleDecrypt();
});

function initAchievementSystem() {
  const achievementKey = "pixel-achievements";
  const visitedKey = "pixel-visited-areas";
  const unlocked = readStoredList(achievementKey);
  const definitions = {
    "chapter-clear": {
      code: "CHAPTER CLEAR",
      detail: "文章已阅读至终点",
    },
    "area-mapper": {
      code: "AREA MAPPER",
      detail: "已探索 5 个不同领域",
    },
    "lost-traveler": {
      code: "LOST TRAVELER",
      detail: "发现了不存在的领域",
    },
    "command-accepted": {
      code: "COMMAND ACCEPTED",
      detail: "隐藏指令认证完成",
    },
  };

  const unlock = (id) => {
    if (unlocked.has(id) || !definitions[id]) {
      return;
    }

    unlocked.add(id);
    writeStoredList(achievementKey, unlocked);
    showAchievement(definitions[id]);
  };

  trackVisitedAreas(visitedKey, unlock);
  trackChapterClear(unlock);
  trackLostPage(unlock);
  trackSecretCommand(unlock);
}

function readStoredList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(value) ? value : []);
  } catch {
    return new Set();
  }
}

function writeStoredList(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify([...values]));
  } catch {
    // Achievements remain available for the current page without storage.
  }
}

function trackVisitedAreas(storageKey, unlock) {
  const visited = readStoredList(storageKey);
  visited.add(window.location.pathname);
  writeStoredList(storageKey, visited);

  if (visited.size >= 5) {
    unlock("area-mapper");
  }
}

function trackChapterClear(unlock) {
  const article = document.querySelector("main article");
  if (!article) {
    return;
  }

  let hasScrolled = false;
  const checkProgress = () => {
    hasScrolled ||= window.scrollY > 48;
    if (hasScrolled && article.getBoundingClientRect().bottom <= window.innerHeight + 24) {
      unlock("chapter-clear");
      window.removeEventListener("scroll", checkProgress);
    }
  };

  window.addEventListener("scroll", checkProgress, { passive: true });
}

function trackLostPage(unlock) {
  if (document.querySelector(".error-page")) {
    unlock("lost-traveler");
  }
}

function trackSecretCommand(unlock) {
  const sequence = [
    "arrowup",
    "arrowup",
    "arrowdown",
    "arrowdown",
    "arrowleft",
    "arrowright",
    "arrowleft",
    "arrowright",
    "b",
    "a",
  ];
  let position = 0;

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    position = key === sequence[position] ? position + 1 : key === sequence[0] ? 1 : 0;

    if (position === sequence.length) {
      unlock("command-accepted");
      document.documentElement.classList.add("secret-signal");
      window.setTimeout(() => {
        document.documentElement.classList.remove("secret-signal");
      }, 8000);
      position = 0;
    }
  });
}

function showAchievement(achievement) {
  let stack = document.querySelector(".achievement-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.className = "achievement-stack";
    stack.setAttribute("aria-live", "polite");
    stack.setAttribute("aria-label", "Achievements");
    document.body.appendChild(stack);
  }

  const notice = document.createElement("div");
  const content = document.createElement("span");
  const title = document.createElement("strong");
  const detail = document.createElement("small");

  notice.className = "achievement-notice";
  notice.setAttribute("role", "status");
  content.className = "achievement-content";
  title.textContent = achievement.code;
  detail.textContent = achievement.detail;

  content.append(title, detail);
  notice.append(content);
  stack.appendChild(notice);

  window.setTimeout(() => {
    notice.classList.add("is-leaving");
    window.setTimeout(() => {
      notice.remove();
      if (!stack.childElementCount) {
        stack.remove();
      }
    }, 280);
  }, 2400);
}

function initIcons() {
  if (typeof feather !== "undefined") {
    feather.replace();
  }
}

function initImageZoom() {
  const images = document.querySelectorAll(".zoom-image");
  if (images.length && typeof mediumZoom !== "undefined") {
    mediumZoom(images, {
      background: "rgba(0, 0, 0, 0.7)",
      margin: 0,
    });
  }
}

function initMath() {
  if (typeof renderMathInElement === "undefined") {
    return;
  }

  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
      { left: "$", right: "$", display: false },
    ],
  });
}

function initTableOfContents() {
  const decodeHash = (hash) => {
    try {
      return decodeURIComponent((hash || "").replace(/^#/, ""));
    } catch {
      return (hash || "").replace(/^#/, "");
    }
  };
  const targets = [...document.querySelectorAll("article > :is(h1, h2, h3)[id]")];
  const floatingTocController = initContextTableOfContents(targets.length > 0);
  if (!targets.length) {
    return;
  }

  document.querySelectorAll(".post-toc-list").forEach((list) => {
    const items = document.createDocumentFragment();

    targets.forEach((heading) => {
      const level = heading.tagName.slice(1);
      const item = document.createElement("li");
      const link = document.createElement("a");
      const title = heading.cloneNode(true);

      item.className = `post-toc-level-${level}`;
      link.href = `#${encodeURIComponent(heading.id)}`;
      title.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      title.querySelectorAll("a").forEach((anchor) => {
        anchor.replaceWith(...anchor.childNodes);
      });
      link.append(...title.childNodes);
      item.appendChild(link);
      items.appendChild(item);
    });

    list.appendChild(items);
  });

  const links = [...document.querySelectorAll(".post-toc a")];
  const decodeTarget = (link) => decodeHash(link.getAttribute("href"));
  let activeId = "";
  let ticking = false;

  const setActive = (id) => {
    if (activeId === id) {
      return;
    }
    activeId = id;

    links.forEach((link) => {
      const active = decodeTarget(link) === id;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    document.querySelectorAll(".post-toc nav").forEach((nav) => {
      const current = [...nav.querySelectorAll("a")].find((link) => decodeTarget(link) === id);
      if (!current) {
        return;
      }

      const navBox = nav.getBoundingClientRect();
      const itemBox = current.getBoundingClientRect();
      const itemTop = itemBox.top - navBox.top + nav.scrollTop;
      const itemBottom = itemTop + itemBox.height;
      if (itemTop < nav.scrollTop) {
        nav.scrollTop = itemTop;
      } else if (itemBottom > nav.scrollTop + nav.clientHeight) {
        nav.scrollTop = itemBottom - nav.clientHeight;
      }
    });
  };

  const updateActive = () => {
    let active = null;

    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
      active = targets.at(-1);
    } else {
      const marker = window.scrollY + 140;
      for (const target of targets) {
        if (target.getBoundingClientRect().top + window.scrollY <= marker) {
          active = target;
        } else {
          break;
        }
      }
    }

    setActive(active?.id || "");

    ticking = false;
  };

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = decodeTarget(link);
      const target = document.getElementById(id);
      if (!target) {
        return;
      }

      event.preventDefault();
      floatingTocController?.hide();
      setActive(id);

      window.requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
        window.history.pushState(null, "", `#${encodeURIComponent(id)}`);
      });
    });
  });

  updateActive();
  const initialId = decodeHash(window.location.hash);
  const initialTarget = initialId ? document.getElementById(initialId) : null;
  if (initialTarget) {
    window.requestAnimationFrame(() => {
      initialTarget.scrollIntoView({ block: "start" });
      setActive(initialId);
    });
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateActive);
      ticking = true;
    }
  }, { passive: true });
}

function initContextTableOfContents(hasContents) {
  const floatingToc = document.querySelector(".post-toc--desktop");
  const resizeHandle = floatingToc?.querySelector(".post-toc-resize-handle");
  const sizeStorageKey = "pixel-context-toc-size";
  const viewportGap = 8;
  const minimumWidth = 144;
  const minimumHeight = 96;
  const longPressDelay = 500;
  const longPressMoveTolerance = 12;
  let longPressTimer = 0;
  let longPressState = null;
  let suppressContextMenuUntil = 0;
  let suppressClickUntil = 0;
  let resizeState = null;

  const clamp = (value, minimum, maximum) => {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  };

  const hide = () => {
    if (!floatingToc) {
      return;
    }
    floatingToc.hidden = true;
    floatingToc.setAttribute("aria-hidden", "true");
  };

  const showAt = (clientX, clientY) => {
    floatingToc.hidden = false;
    floatingToc.setAttribute("aria-hidden", "false");
    floatingToc.style.left = `${clientX}px`;
    floatingToc.style.top = `${clientY}px`;

    const rect = floatingToc.getBoundingClientRect();
    floatingToc.style.left = `${clamp(
      clientX,
      viewportGap,
      window.innerWidth - rect.width - viewportGap,
    )}px`;
    floatingToc.style.top = `${clamp(
      clientY,
      viewportGap,
      window.innerHeight - rect.height - viewportGap,
    )}px`;
  };

  const readSize = () => {
    try {
      const size = JSON.parse(sessionStorage.getItem(sizeStorageKey) || "null");
      if (!size || !Number.isFinite(size.width) || !Number.isFinite(size.height)) {
        return;
      }
      floatingToc.style.width = `${Math.max(size.width, minimumWidth)}px`;
      floatingToc.style.height = `${Math.max(size.height, minimumHeight)}px`;
      floatingToc.classList.add("is-user-sized");
    } catch {
      // Keep the default size when session storage is unavailable.
    }
  };

  const writeSize = () => {
    const rect = floatingToc.getBoundingClientRect();
    try {
      sessionStorage.setItem(sizeStorageKey, JSON.stringify({
        width: rect.width,
        height: rect.height,
      }));
    } catch {
      // Resizing still works for the current page without storage.
    }
  };

  const cancelLongPress = () => {
    window.clearTimeout(longPressTimer);
    longPressTimer = 0;
    longPressState = null;
  };

  hide();
  document.documentElement.classList.toggle("has-context-toc", Boolean(hasContents));

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (!hasContents || !floatingToc) {
      return;
    }
    if (Date.now() < suppressContextMenuUntil) {
      return;
    }
    showAt(event.clientX, event.clientY);
  });

  if (!hasContents || !floatingToc) {
    return null;
  }

  readSize();

  document.addEventListener("pointerdown", (event) => {
    if (!floatingToc.hidden && !floatingToc.contains(event.target)) {
      hide();
    }

    if (
      event.pointerType !== "touch"
      || !event.isPrimary
      || floatingToc.contains(event.target)
    ) {
      return;
    }

    cancelLongPress();
    longPressState = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
    };
    longPressTimer = window.setTimeout(() => {
      if (!longPressState) {
        return;
      }
      showAt(longPressState.clientX, longPressState.clientY);
      suppressContextMenuUntil = Date.now() + 800;
      suppressClickUntil = Date.now() + 700;
      longPressTimer = 0;
    }, longPressDelay);
  });

  document.addEventListener("pointermove", (event) => {
    if (!longPressState || event.pointerId !== longPressState.pointerId) {
      return;
    }
    if (
      Math.hypot(
        event.clientX - longPressState.clientX,
        event.clientY - longPressState.clientY,
      ) > longPressMoveTolerance
    ) {
      cancelLongPress();
    }
  });

  document.addEventListener("pointerup", cancelLongPress);
  document.addEventListener("pointercancel", cancelLongPress);

  document.addEventListener("click", (event) => {
    if (Date.now() >= suppressClickUntil || floatingToc.contains(event.target)) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hide();
    }
  });

  window.addEventListener("resize", () => {
    if (floatingToc.hidden) {
      return;
    }
    const rect = floatingToc.getBoundingClientRect();
    showAt(rect.left, rect.top);
  });

  resizeHandle?.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    const rect = floatingToc.getBoundingClientRect();
    resizeState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      left: rect.left,
      top: rect.top,
    };
    floatingToc.classList.add("is-user-sized");
    resizeHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  });

  resizeHandle?.addEventListener("pointermove", (event) => {
    if (!resizeState || event.pointerId !== resizeState.pointerId) {
      return;
    }
    floatingToc.style.width = `${clamp(
      resizeState.startWidth + event.clientX - resizeState.startX,
      minimumWidth,
      window.innerWidth - resizeState.left - viewportGap,
    )}px`;
    floatingToc.style.height = `${clamp(
      resizeState.startHeight + event.clientY - resizeState.startY,
      minimumHeight,
      window.innerHeight - resizeState.top - viewportGap,
    )}px`;
  });

  const finishResize = (event) => {
    if (!resizeState || event.pointerId !== resizeState.pointerId) {
      return;
    }
    resizeState = null;
    if (resizeHandle.hasPointerCapture(event.pointerId)) {
      resizeHandle.releasePointerCapture(event.pointerId);
    }
    writeSize();
  };

  resizeHandle?.addEventListener("pointerup", finishResize);
  resizeHandle?.addEventListener("pointercancel", finishResize);

  return { hide };
}

function initMermaid() {
  if (typeof mermaid === "undefined") {
    return;
  }

  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  mermaid.initialize({
    startOnLoad: true,
    securityLevel: "loose",
    theme: colorScheme.matches ? "dark" : "base",
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: "cardinal",
    },
  });

  const reloadForTheme = () => window.location.reload();
  if (colorScheme.addEventListener) {
    colorScheme.addEventListener("change", reloadForTheme);
  } else {
    colorScheme.addListener(reloadForTheme);
  }
}

function initTitleDecrypt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const targets = document.querySelectorAll("h1.title, p.site-description");
  const glyphs = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789!?#$@&%";

  targets.forEach((element) => {
    const originalText = element.textContent.trim();
    if (!originalText) {
      return;
    }

    const maxSteps = originalText.length + 8;
    let step = 0;

    const timer = window.setInterval(() => {
      step += 1;
      const revealedLength = Math.floor((step / maxSteps) * originalText.length);
      let result = "";

      for (let index = 0; index < originalText.length; index += 1) {
        result += index < revealedLength
          ? originalText.charAt(index)
          : glyphs.charAt(Math.floor(Math.random() * glyphs.length));
      }

      if (revealedLength < originalText.length) {
        result += '<span class="decrypt-cursor">█</span>';
      }

      element.innerHTML = result;

      if (step >= maxSteps) {
        window.clearInterval(timer);
        element.textContent = originalText;
      }
    }, 48);
  });
}
