/* Lightbox for photo-grid images and videos. One dialog, same controls for both. */
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
  const rootSelector = GALLERY_CLASSES.map((name) => "." + name).join(", ");
  const selector = GALLERY_CLASSES.map((name) => "." + name + " img, ." + name + " video").join(", ");
  const groups = new Map();
  document.querySelectorAll(selector).forEach((media) => {
    if (!playable(media) || media.closest(".photo-lightbox")) return;
    const root = media.closest(rootSelector);
    if (!root) return;
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(media);
  });
  if (!groups.size) return;

  const dialog = document.createElement("dialog");
  dialog.id = "photo-lightbox";
  dialog.className = "photo-lightbox";
  dialog.setAttribute("aria-modal", "true");

  const closeBtn = control("lb-close", "Close", "\u00d7");
  const fullBtn = control("lb-full", "Full screen", "Full screen");
  const prev = control("lb-prev", "Previous", "\u2039");
  const next = control("lb-next", "Next", "\u203a");
  const figure = document.createElement("figure");
  figure.className = "lb-figure";
  const photo = document.createElement("img");
  photo.className = "lb-img";
  photo.alt = "";
  photo.draggable = false;
  photo.hidden = true;
  const clip = document.createElement("video");
  clip.className = "lb-video";
  clip.controls = true;
  clip.playsInline = true;
  clip.setAttribute("playsinline", "");
  clip.preload = "metadata";
  clip.hidden = true;
  const caption = document.createElement("figcaption");
  caption.className = "lb-caption";
  caption.id = "photo-lightbox-caption";
  const status = document.createElement("p");
  status.className = "lb-status";
  status.setAttribute("role", "status");
  figure.append(photo, clip, caption);
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

  function playable(media) {
    if (media.tagName === "IMG") return !!media.getAttribute("src");
    return !!media.getAttribute("src") || !!media.querySelector("source[src]");
  }

  function labelFor(media) {
    if (media.tagName === "IMG") return media.getAttribute("alt") || "";
    const named = media.getAttribute("aria-label");
    if (named) return named;
    const note = media.parentElement && media.parentElement.querySelector("figcaption");
    return note ? note.textContent.trim() : "";
  }

  function silence(video) {
    video.pause();
    if (video.currentTime) {
      try { video.currentTime = 0; } catch (error) { /* seek may be unavailable before metadata */ }
    }
  }

  function silenceTiles() {
    groups.forEach((items) => {
      items.forEach((media) => {
        if (media.tagName === "VIDEO") silence(media);
      });
    });
  }

  function clearClip() {
    clip.pause();
    clip.autoplay = false;
    clip.removeAttribute("src");
    while (clip.firstChild) clip.removeChild(clip.firstChild);
    try { clip.load(); } catch (error) { /* reset even if the element is mid-load */ }
  }

  function tabbables() {
    const list = [closeBtn, fullBtn, prev, next];
    if (!clip.hidden) list.push(clip);
    return list.filter((el) => !el.hidden && !el.disabled);
  }

  function presentImage(img) {
    clip.hidden = true;
    photo.hidden = false;
    photo.alt = "";
    photo.src = fullImageURL(img.getAttribute("src"), img.getAttribute("srcset"), document.baseURI);
    photo.removeAttribute("srcset");
  }

  function presentVideo(video) {
    photo.hidden = true;
    photo.removeAttribute("src");
    clip.hidden = false;
    clip.controls = true;
    clip.playsInline = true;
    clip.setAttribute("playsinline", "");
    clip.preload = "metadata";
    clip.muted = true;
    clip.defaultMuted = true;
    clip.setAttribute("muted", "");
    const named = video.getAttribute("aria-label");
    if (named) clip.setAttribute("aria-label", named);
    else clip.removeAttribute("aria-label");
    const poster = video.getAttribute("poster");
    if (poster) clip.poster = absoluteURL(poster, document.baseURI);
    else clip.removeAttribute("poster");
    video.querySelectorAll("source").forEach((source) => {
      const node = document.createElement("source");
      const src = source.getAttribute("src");
      if (src) node.src = absoluteURL(src, document.baseURI);
      const type = source.getAttribute("type");
      if (type) node.type = type;
      clip.append(node);
    });
    if (!clip.querySelector("source") && video.getAttribute("src")) {
      clip.src = absoluteURL(video.getAttribute("src"), document.baseURI);
    }
    clip.autoplay = true;
    clip.load();
    const pending = clip.play();
    if (pending && pending.catch) pending.catch(() => {});
  }

  function show(nextIndex, announce) {
    clearClip();
    silenceTiles();
    active = active.filter((media) => media.isConnected);
    if (!active.length) {
      closeLightbox();
      return;
    }
    index = Math.max(0, Math.min(active.length - 1, nextIndex));
    const media = active[index];
    const text = labelFor(media);
    if (media.tagName === "VIDEO") presentVideo(media);
    else presentImage(media);
    caption.textContent = text;
    caption.hidden = !text;
    if (text) {
      dialog.setAttribute("aria-labelledby", caption.id);
      dialog.removeAttribute("aria-label");
    } else {
      dialog.removeAttribute("aria-labelledby");
      dialog.setAttribute("aria-label", media.tagName === "VIDEO" ? "Expanded video" : "Expanded photo");
    }
    const many = active.length > 1;
    prev.hidden = !many;
    next.hidden = !many;
    prev.disabled = index === 0;
    next.disabled = index === active.length - 1;
    if (announce) status.textContent = text || (media.tagName === "VIDEO" ? "Expanded video" : "Expanded photo");
  }

  function open(media, focusEl) {
    let group = null;
    for (const items of groups.values()) {
      if (items.includes(media)) group = items;
    }
    if (!group) return;
    trigger = focusEl || media;
    active = group.slice();
    show(Math.max(0, group.indexOf(media)), false);
    if (!dialog.open) {
      document.documentElement.classList.add("lightbox-open");
      dialog.showModal();
    }
    closeBtn.focus();
  }

  function closeLightbox() {
    clearClip();
    silenceTiles();
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

  groups.forEach((items) => {
    items.forEach((media) => {
      if (media.tagName === "VIDEO") {
        const hit = document.createElement("button");
        hit.type = "button";
        hit.className = "lb-hit";
        const icon = document.createElement("span");
        icon.className = "lb-hit-icon";
        icon.setAttribute("aria-hidden", "true");
        hit.append(icon);
        const text = labelFor(media);
        hit.setAttribute("aria-label", text ? "Play " + text : "Play video");
        hit.setAttribute("aria-haspopup", "dialog");
        hit.setAttribute("aria-controls", dialog.id);
        media.classList.add("lb-source");
        media.tabIndex = -1;
        media.addEventListener("play", () => silence(media));
        media.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          silence(media);
          open(media, hit);
        });
        hit.addEventListener("click", (event) => {
          event.preventDefault();
          silence(media);
          open(media, hit);
        });
        if (media.parentElement) media.parentElement.append(hit);
        return;
      }
      media.tabIndex = 0;
      media.setAttribute("role", "button");
      media.setAttribute("aria-haspopup", "dialog");
      media.setAttribute("aria-controls", dialog.id);
      media.addEventListener("click", (event) => {
        event.preventDefault();
        open(media);
      });
      media.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        open(media);
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
    clearClip();
    silenceTiles();
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
