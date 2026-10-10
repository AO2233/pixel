import { prefersReducedMotion } from "./motion";

export function initTableOfContents() {
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

    const branches = treeBranches(targets.map((heading) => Number(heading.tagName.slice(1))));

    targets.forEach((heading, index) => {
      const level = heading.tagName.slice(1);
      const item = document.createElement("li");
      const link = document.createElement("a");
      const title = heading.cloneNode(true);

      item.className = `post-toc-level-${level}`;
      link.href = `#${encodeURIComponent(heading.id)}`;
      title.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
      // KaTeX ships both HTML and MathML; keep only the visible HTML copy.
      title.querySelectorAll(".katex-mathml").forEach((node) => node.remove());
      title.querySelectorAll("a").forEach((anchor) => {
        anchor.replaceWith(...anchor.childNodes);
      });

      if (branches[index]) {
        const branch = document.createElement("span");
        branch.className = "post-toc-branch";
        branch.setAttribute("aria-hidden", "true");
        branch.textContent = branches[index];
        link.appendChild(branch);
      }
      const text = document.createElement("span");
      text.className = "post-toc-text";
      text.append(...title.childNodes);
      link.appendChild(text);
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
          behavior: prefersReducedMotion() ? "auto" : "smooth",
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
  document.documentElement.classList.toggle("has-context-toc", Boolean(hasContents && floatingToc));

  // Only article pages with headings take over the context menu; elsewhere the
  // browser menu (open in new tab, copy link, ...) keeps working.
  if (!hasContents || !floatingToc) {
    return null;
  }

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (Date.now() < suppressContextMenuUntil) {
      return;
    }
    showAt(event.clientX, event.clientY);
  });

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

// Draw the hierarchy as a DOS-style tree: "├─" for an item with later
// siblings, "└─" for the last one, and "│ " columns for open ancestors.
// Top-level headings get no branch.
function treeBranches(levels) {
  const top = Math.min(...levels);
  const hasNextSibling = levels.map((level, index) => {
    for (let next = index + 1; next < levels.length; next += 1) {
      if (levels[next] === level) return true;
      if (levels[next] < level) return false;
    }
    return false;
  });

  return levels.map((level, index) => {
    if (level === top) {
      return "";
    }
    let prefix = "";
    for (let depth = top + 1; depth < level; depth += 1) {
      // Find the nearest ancestor at this depth and check whether it continues.
      let ancestor = index - 1;
      while (ancestor >= 0 && levels[ancestor] !== depth) ancestor -= 1;
      prefix += ancestor >= 0 && hasNextSibling[ancestor] ? "│ " : "  ";
    }
    return prefix + (hasNextSibling[index] ? "├─" : "└─");
  });
}
