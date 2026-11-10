/* Image-only lightbox for photo grids. Only img elements inside those grids are wired. */
export const GALLERY_CLASSES = ["gallery", "shots", "certs", "card-shots", "grok-shots"];

export function fullImageURL(src, srcset, base) {
  const fallback = absoluteURL(src, base);
  let bestWidth = null;
  let bestDensity = null;
  let bare = "";
  for (const part of String(srcset || "").split(",")) {
    const bits = part.trim().split(/\s+/);
    if (!bits[0]) continue;
    const url = absoluteURL(bits[0], base);
    const desc = bits[1] || "";
    const width = /^(\d+(?:\.\d+)?)w$/i.exec(desc);
    const density = /^(\d+(?:\.\d+)?)x$/i.exec(desc);
    if (width) {
      const value = Number(width[1]);
      if (!bestWidth || value >= bestWidth.value) bestWidth = { value, url };
    } else if (density) {
      const value = Number(density[1]);
      if (!bestDensity || value >= bestDensity.value) bestDensity = { value, url };
    } else if (url) {
      bare = url;
    }
  }
  if (bestWidth) return bestWidth.url;
  if (bestDensity) return bestDensity.url;
  return bare || fallback;
}

export function fullscreenControlSupported(doc, nav) {
  const root = doc && doc.documentElement;
  if (!root || typeof root.requestFullscreen !== "function") return false;
  const ua = (nav && nav.userAgent) || "";
  const platform = (nav && nav.platform) || "";
  const touch = !!(nav && nav.maxTouchPoints > 1);
  const ios = /iP(hone|ad|od)/.test(ua) || (platform === "MacIntel" && touch);
  return !ios;
}

function absoluteURL(url, base) {
  if (!url) return "";
  try {
    return new URL(url, base).href;
  } catch (error) {
    return url;
  }
}

function boot() {
  const selector = GALLERY_CLASSES.map((name) => "." + name + " img").join(", ");
  const groups = new Map();
  document.querySelectorAll(selector).forEach((img) => {
    if (!img.getAttribute("src") || img.closest(".photo-lightbox")) return;
    const root = img.closest(GALLERY_CLASSES.map((name) => "." + name).join(", "));
    if (!root) return;
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(img);
  });
  if (!groups.size) return;

  const dialog = document.createElement("dialog");
  dialog.id = "photo-lightbox";
  dialog.className = "photo-lightbox";
  dialog.setAttribute("aria-modal", "true");

  const closeBtn = control("lb-close", "Close", "\u00d7");
  const fullBtn = control("lb-full", "Full screen", "Full screen");
  const prev = control("lb-prev", "Previous image", "\u2039");
  const next = control("lb-next", "Next image", "\u203a");
  const figure = document.createElement("figure");
  figure.className = "lb-figure";
  const photo = document.createElement("img");
  photo.className = "lb-img";
  photo.alt = "";
  photo.draggable = false;
  const caption = document.createElement("figcaption");
  caption.className = "lb-caption";
  caption.id = "photo-lightbox-caption";
  const status = document.createElement("p");
  status.className = "lb-status";
  status.setAttribute("role", "status");
  figure.append(photo, caption);
  const stage = document.createElement("div");
  stage.className = "lb-stage";
  stage.append(closeBtn, fullBtn, prev, next, figure, status);
  dialog.append(stage);
  document.body.append(dialog);

  const canFullscreen = fullscreenControlSupported(document, navigator);
  if (!canFullscreen) fullBtn.hidden = true;

  let active = [];
  let index = 0;
  let trigger = null;
  let origin = null;
  let swiped = false;

  function control(className, label, text) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lb-btn " + className;
    button.setAttribute("aria-label", label);
    button.textContent = text;
    return button;
  }

  function tabbables() {
    return [closeBtn, fullBtn, prev, next].filter((el) => !el.hidden && !el.disabled);
  }

  function show(nextIndex, announce) {
    active = active.filter((img) => img.isConnected);
    if (!active.length) {
      closeLightbox();
      return;
    }
    index = Math.max(0, Math.min(active.length - 1, nextIndex));
    const img = active[index];
    const text = img.getAttribute("alt") || "";
    photo.alt = "";
    photo.src = fullImageURL(img.getAttribute("src"), img.getAttribute("srcset"), document.baseURI);
    photo.removeAttribute("srcset");
    caption.textContent = text;
    caption.hidden = !text;
    if (text) {
      dialog.setAttribute("aria-labelledby", caption.id);
      dialog.removeAttribute("aria-label");
    } else {
      dialog.removeAttribute("aria-labelledby");
      dialog.setAttribute("aria-label", "Expanded photo");
    }
    const many = active.length > 1;
    prev.hidden = !many;
    next.hidden = !many;
    prev.disabled = index === 0;
    next.disabled = index === active.length - 1;
    if (announce) status.textContent = text || "Expanded photo";
  }

  function open(img) {
    let group = null;
    for (const images of groups.values()) {
      if (images.includes(img)) group = images;
    }
    if (!group) return;
    trigger = img;
    active = group.slice();
    show(Math.max(0, group.indexOf(img)), false);
    if (!dialog.open) {
      document.documentElement.classList.add("lightbox-open");
      dialog.showModal();
    }
    closeBtn.focus();
  }

  function closeLightbox() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {}).finally(() => {
        if (dialog.open) dialog.close();
      });
      return;
    }
    if (dialog.open) dialog.close();
  }

  function step(delta) {
    show(index + delta, true);
  }

  function syncFull() {
    const on = document.fullscreenElement === stage;
    fullBtn.textContent = on ? "Exit" : "Full screen";
    fullBtn.setAttribute("aria-label", on ? "Exit full screen" : "Full screen");
  }

  groups.forEach((images) => {
    images.forEach((img) => {
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-haspopup", "dialog");
      img.setAttribute("aria-controls", dialog.id);
      img.addEventListener("click", (event) => {
        event.preventDefault();
        open(img);
      });
      img.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        open(img);
      });
    });
  });

  closeBtn.addEventListener("click", closeLightbox);
  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  fullBtn.addEventListener("click", () => {
    if (!canFullscreen) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else stage.requestFullscreen().catch(() => {});
  });
  document.addEventListener("fullscreenchange", syncFull);

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeLightbox();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("lightbox-open");
    const back = trigger;
    trigger = null;
    status.textContent = "";
    if (back && back.isConnected) back.focus();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (document.fullscreenElement) return;
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
      return;
    }
    if (event.key !== "Tab") return;
    const list = tabbables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (event.shiftKey && (document.activeElement === first || !list.includes(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    origin = { x: event.clientX, y: event.clientY };
  });
  dialog.addEventListener("pointerup", (event) => {
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    origin = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    swiped = true;
    step(dx < 0 ? 1 : -1);
  });
  dialog.addEventListener("pointercancel", () => {
    origin = null;
  });
  dialog.addEventListener("click", (event) => {
    if (swiped) {
      swiped = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.target === dialog || event.target === stage) closeLightbox();
  }, true);
}

if (typeof document !== "undefined") boot();
