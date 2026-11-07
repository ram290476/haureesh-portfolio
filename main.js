/* Midnight+ interactions. Content stays in the HTML; this file only animates it. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var narrowQuery = window.matchMedia("(max-width: 900px)");
  var phoneQuery = window.matchMedia("(max-width: 640px)");
  var fineQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  function syncMotion() {
    root.classList.toggle("reduce", reduceQuery.matches);
  }
  syncMotion();
  reduceQuery.addEventListener("change", syncMotion);

  function motionOn() {
    return !reduceQuery.matches;
  }

  document.querySelectorAll(".ph img").forEach(function (img) {
    function hideLabel() {
      var label = img.parentElement && img.parentElement.querySelector(".ph-label");
      if (label) label.setAttribute("aria-hidden", "true");
    }
    if (img.complete && img.naturalWidth > 0) hideLabel();
    img.addEventListener("load", hideLabel);
    img.addEventListener("error", function () { img.remove(); });
  });

  /* Letter-by-letter headline */
  var cyc = document.getElementById("cyc");
  var cycLive = document.getElementById("cyc-live");
  var words = ["Aerospace Engineer", "Rocketry Team", "Researcher", "Black Belt"];
  var wordIndex = 0;
  var cycTimer = 0;

  function paintWord(word, hidden) {
    if (!cyc) return;
    cyc.replaceChildren();
    Array.from(word).forEach(function (ch) {
      var span = document.createElement("span");
      span.textContent = ch === " " ? "\u00a0" : ch;
      if (hidden) span.classList.add("o");
      cyc.appendChild(span);
    });
  }

  function showWord(word) {
    paintWord(word, motionOn());
    if (cycLive) cycLive.textContent = word;
    if (!motionOn()) return;
    Array.from(cyc.children).forEach(function (span, i) {
      window.setTimeout(function () { span.classList.remove("o"); }, i * 30);
    });
  }

  function hideWord(done) {
    var letters = cyc ? Array.from(cyc.children) : [];
    if (!motionOn() || !letters.length) { done(); return; }
    letters.forEach(function (span, i) {
      window.setTimeout(function () { span.classList.add("o"); }, i * 30);
    });
    window.setTimeout(done, letters.length * 30 + 250);
  }

  function cycleOnce() {
    hideWord(function () {
      wordIndex = (wordIndex + 1) % words.length;
      showWord(words[wordIndex]);
    });
  }

  function startCycle() {
    window.clearInterval(cycTimer);
    if (!cyc) return;
    showWord(words[0]);
    if (!motionOn()) return;
    cycTimer = window.setInterval(cycleOnce, 2600);
  }
  startCycle();

  /* Spring entrance */
  var entranceTargets = Array.from(document.querySelectorAll(".t, .xc"));
  var entranceIO = null;
  function armEntrance() {
    if (entranceIO) {
      entranceIO.disconnect();
      entranceIO = null;
    }
    if (!motionOn() || !("IntersectionObserver" in window)) {
      entranceTargets.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    entranceIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        entranceIO.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    entranceTargets.forEach(function (el, i) {
      el.style.transitionDelay = (i % 8) * 80 + "ms";
      entranceIO.observe(el);
    });
  }
  armEntrance();
  window.setTimeout(function () {
    entranceTargets.forEach(function (el) { el.classList.add("in"); });
  }, 1800);

  /* Count-up for the two verified figures only */
  function countUp(el) {
    var target = Number(el.getAttribute("data-value"));
    if (!motionOn() || !target) {
      el.textContent = String(target);
      return;
    }
    var start = performance.now();
    function frame(now) {
      var p = Math.min(1, (now - start) / 1600);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1 && motionOn()) requestAnimationFrame(frame);
      else el.textContent = String(target);
    }
    requestAnimationFrame(frame);
  }
  document.querySelectorAll(".cnt").forEach(function (el) {
    if (!("IntersectionObserver" in window)) { countUp(el); return; }
    var once = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(el);
        once.disconnect();
      });
    }, { threshold: 0.4 });
    once.observe(el);
  });

  /* Wave lines */
  var waveMain = document.getElementById("wv");
  var waveAlt = Array.from(document.querySelectorAll(".wv2"));
  function wavePath(time, phase) {
    var d = "M0 23";
    for (var x = 0; x <= 400; x += 8) {
      var y = 23 + Math.sin(x / 32 + time / 500 + phase) * 9 * Math.sin(x / 130 + time / 1700);
      d += " L" + x + " " + y.toFixed(2);
    }
    return d;
  }
  function drawWaves(time) {
    if (!waveMain) return;
    waveMain.setAttribute("d", wavePath(time, 0));
    waveAlt.forEach(function (path) { path.setAttribute("d", wavePath(time, 2)); });
  }
  var waveRunning = false;
  function waveLoop(time) {
    drawWaves(motionOn() ? time : 0);
    if (motionOn()) requestAnimationFrame(waveLoop);
    else waveRunning = false;
  }
  function ensureWave() {
    if (!motionOn()) {
      drawWaves(0);
      return;
    }
    if (waveRunning) return;
    waveRunning = true;
    requestAnimationFrame(waveLoop);
  }
  ensureWave();

  /* Static glow is the CSS sphere. WebGL runs on larger screens when motion is allowed. */
  var canvas = document.getElementById("orb");
  function startOrb() {
    if (!canvas || !motionOn() || narrowQuery.matches) {
      if (canvas) canvas.remove();
      return;
    }
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
    if (!gl) { canvas.remove(); return; }
    var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}";
    var fs = "precision mediump float;uniform float t;uniform vec2 r;void main(){vec2 uv=(gl_FragCoord.xy-.5*r)/r.y*2.2;float d=length(uv);float z=sqrt(max(0.,1.-d*d));vec3 n=vec3(uv,z);float l=max(dot(n,normalize(vec3(-.5,.6,.8))),0.);float b=.5+.5*sin(8.*n.y+t+3.*n.x*sin(t*.5));vec3 col=mix(vec3(.43,.3,1.),vec3(.37,.9,1.),b)*(.25+.75*l)*step(d,1.);float glow=.35/(1.+30.*pow(max(d-1.,0.),1.2))*step(1.,d);gl_FragColor=vec4(col*.55+vec3(.37,.9,1.)*glow,(step(d,1.)*.55+glow));}";
    function shader(type, source) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      return sh;
    }
    var program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(program);
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(program, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var uTime = gl.getUniformLocation(program, "t");
    gl.uniform2f(gl.getUniformLocation(program, "r"), canvas.width, canvas.height);
    var fallback = document.querySelector(".orbf");
    if (fallback) fallback.style.opacity = "0.45";
    function frame(t) {
      if (!motionOn() || document.hidden) {
        requestAnimationFrame(frame);
        return;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  startOrb();

  /* Pointer tilt. Rocket tile flips instead. */
  if (motionOn() && fineQuery.matches) {
    document.querySelectorAll(".t").forEach(function (tile) {
      if (tile.classList.contains("rocket")) return;
      tile.addEventListener("mousemove", function (event) {
        var rect = tile.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;
        tile.style.transitionDelay = "0ms";
        tile.style.transform = "translateY(-8px) rotateX(" + (-y * 8) + "deg) rotateY(" + (x * 8) + "deg)";
      });
      tile.addEventListener("mouseleave", function () {
        tile.style.transform = "";
      });
      tile.addEventListener("blur", function () { tile.style.transform = ""; });
    });
  }

  /* Rocket flip: hover peeks on a fine pointer. Click, Enter, or Space pins the spec sheet. */
  var rocket = document.getElementById("rocket");
  var flipOpen = document.getElementById("flip-open");
  if (rocket && flipOpen) {
    var pinned = false;
    var hovering = false;
    function paintRocket() {
      var show = pinned || hovering;
      rocket.classList.toggle("is-flipped", show);
      flipOpen.setAttribute("aria-expanded", show ? "true" : "false");
    }
    rocket.addEventListener("click", function () {
      pinned = !pinned;
      if (!pinned) hovering = false;
      paintRocket();
    });
    if (fineQuery.matches) {
      rocket.addEventListener("mouseenter", function () {
        hovering = true;
        paintRocket();
      });
      rocket.addEventListener("mouseleave", function () {
        hovering = false;
        paintRocket();
      });
    }
  }

  /* Center-focus gallery */
  var track = document.getElementById("gtrack");
  var gal = document.getElementById("gal");
  var cards = track ? Array.from(track.querySelectorAll(".g")) : [];
  var galIndex = 0;
  var galStatus = document.getElementById("gal-status");

  function go(index) {
    if (!cards.length || !track || !gal) return;
    galIndex = (index + cards.length) % cards.length;
    cards.forEach(function (card, i) {
      var on = i === galIndex;
      card.classList.toggle("on", on);
      if (on) card.setAttribute("aria-current", "true");
      else card.removeAttribute("aria-current");
    });
    if (reduceQuery.matches) {
      track.style.transform = "";
    } else {
      var width = cards[0].offsetWidth;
      var gap = parseFloat(window.getComputedStyle(track).columnGap || window.getComputedStyle(track).gap) || 20;
      var view = gal.clientWidth;
      track.style.transform = "translateX(" + (view / 2 - width / 2 - galIndex * (width + gap)) + "px)";
    }
    var title = cards[galIndex].querySelector("h3");
    if (galStatus && title) galStatus.textContent = title.textContent + ", " + (galIndex + 1) + " of " + cards.length;
  }

  var prev = document.getElementById("gp");
  var next = document.getElementById("gn");
  if (prev) prev.addEventListener("click", function () { go(galIndex - 1); });
  if (next) next.addEventListener("click", function () { go(galIndex + 1); });
  cards.forEach(function (card, i) {
    var button = card.querySelector("[data-view]");
    if (!button) return;
    button.addEventListener("click", function () { go(i); });
    button.addEventListener("focus", function () { go(i); });
  });
  if (gal) {
    gal.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); go(galIndex + 1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(galIndex - 1); }
    });
    var swipeX = null;
    gal.addEventListener("pointerdown", function (event) { swipeX = event.clientX; });
    gal.addEventListener("pointerup", function (event) {
      if (swipeX == null) return;
      var delta = event.clientX - swipeX;
      swipeX = null;
      if (Math.abs(delta) > 48) go(galIndex + (delta < 0 ? 1 : -1));
    });
  }
  function galleryFromHash(useDefault) {
    var id = location.hash.replace("#", "");
    var found = cards.findIndex(function (card) { return card.getAttribute("data-id") === id; });
    if (found >= 0) go(found);
    else if (useDefault) go(Math.min(1, cards.length - 1));
  }
  if (cards.length) {
    galleryFromHash(true);
    window.addEventListener("resize", function () { go(galIndex); });
    window.addEventListener("load", function () { go(galIndex); });
    window.addEventListener("hashchange", function () { galleryFromHash(false); });
  }

  /* Expanding project row */
  document.querySelectorAll(".ex button").forEach(function (button) {
    button.addEventListener("click", function () {
      var card = button.closest(".ex");
      var open = !card.classList.contains("open");
      card.classList.toggle("open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* Draggable awards ring. Flat list when motion is reduced. */
  var stage = document.getElementById("stage");
  var ring = document.getElementById("ring");
  var ringCards = ring ? Array.from(ring.children) : [];
  var angle = 0;
  var velocity = 0.15;
  var dragging = false;
  var lastX = 0;
  var ringStatus = document.getElementById("ring-status");

  function ringRadius() {
    var width = stage ? stage.clientWidth : 800;
    return Math.max(150, Math.min(300, width * 0.26));
  }
  function ringIs3d() {
    return motionOn() && !phoneQuery.matches;
  }
  function closestRing() {
    if (!stage || !ringCards.length) return 0;
    var mid = stage.getBoundingClientRect().left + stage.clientWidth / 2;
    var best = 0;
    var bestDistance = Infinity;
    ringCards.forEach(function (card, i) {
      var rect = card.getBoundingClientRect();
      var distance = Math.abs(rect.left + rect.width / 2 - mid);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  }
  function layoutRing() {
    if (!ringCards.length) return;
    if (!ringIs3d()) {
      ringCards.forEach(function (card) { card.style.transform = ""; });
      if (ring) ring.style.transform = "";
      return;
    }
    var step = 360 / ringCards.length;
    var radius = ringRadius();
    ringCards.forEach(function (card, i) {
      card.style.transform = "rotateY(" + (i * step) + "deg) translateZ(" + radius + "px)";
    });
  }
  function frontIndex() {
    if (!ringCards.length) return 0;
    var step = 360 / ringCards.length;
    var i = Math.round((-angle) / step);
    return ((i % ringCards.length) + ringCards.length) % ringCards.length;
  }
  function announceRing() {
    if (!ringStatus || !ringCards.length) return;
    var heading = ringCards[frontIndex()].querySelector("h3");
    if (heading) ringStatus.textContent = heading.textContent;
  }
  function focusRingCard(index) {
    var card = ringCards[(index + ringCards.length) % ringCards.length];
    card.setAttribute("tabindex", "-1");
    if (!ringIs3d()) {
      card.scrollIntoView({ inline: "center", block: "nearest", behavior: motionOn() ? "smooth" : "auto" });
    }
    if (ringStatus) {
      var heading = card.querySelector("h3");
      if (heading) ringStatus.textContent = heading.textContent;
    }
    return card;
  }
  function spinStep(direction) {
    if (!ringCards.length) return;
    if (!ringIs3d()) {
      focusRingCard(closestRing() - direction);
      return;
    }
    angle += direction * (360 / ringCards.length);
    velocity = 0;
    if (ring) ring.style.transform = "rotateX(-8deg) rotateY(" + angle + "deg)";
    announceRing();
  }
  layoutRing();
  if (ring && motionOn()) {
    velocity = fineQuery.matches && !narrowQuery.matches ? 0.15 : 0;
    function spin() {
      if (!motionOn()) return;
      if (ringIs3d() && !document.hidden) {
        angle += velocity;
        if (!dragging) {
          var idle = fineQuery.matches && !narrowQuery.matches ? 0.15 : 0;
          velocity += (idle - velocity) * 0.02;
        }
        ring.style.transform = "rotateX(-8deg) rotateY(" + angle + "deg)";
      }
      requestAnimationFrame(spin);
    }
    requestAnimationFrame(spin);
  }
  if (stage && motionOn()) {
    stage.addEventListener("pointerdown", function (event) {
      if (!ringIs3d()) return;
      dragging = true;
      lastX = event.clientX;
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener("pointermove", function (event) {
      if (!dragging) return;
      velocity = (event.clientX - lastX) * 0.25;
      lastX = event.clientX;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      announceRing();
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); spinStep(-1); }
      if (event.key === "ArrowLeft") { event.preventDefault(); spinStep(1); }
    });
  }
  var ringPrev = document.getElementById("ring-prev");
  var ringNext = document.getElementById("ring-next");
  if (ringPrev) ringPrev.addEventListener("click", function () { spinStep(1); });
  if (ringNext) ringNext.addEventListener("click", function () { spinStep(-1); });
  announceRing();

  /* About spiral → flat timeline */
  var spiralScroll = document.getElementById("spiral-scroll");
  var spiral = document.getElementById("sp");
  var axis = document.getElementById("axis");
  var years = spiral ? Array.from(spiral.querySelectorAll(".yc")) : [];

  function placeSpiral() {
    if (!spiral || !years.length || !spiralScroll) return;
    if (!motionOn() || narrowQuery.matches) {
      years.forEach(function (card) { card.style.transform = ""; card.style.opacity = ""; });
      if (axis) axis.style.opacity = "0";
      return;
    }
    var rect = spiralScroll.getBoundingClientRect();
    var distance = rect.height - window.innerHeight;
    var p = distance <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / distance));
    var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    var n = years.length;
    var cardW = years[0].offsetWidth || 168;
    var radius = Math.max(70, Math.min(240, spiral.clientWidth / 2 - cardW / 2 - 20));
    var span = Math.max(cardW, spiral.clientWidth - cardW - 32);
    var step = span / (n - 1);
    years.forEach(function (card, i) {
      var a = i * 60 + (1 - e) * 120;
      var sx = Math.sin(a * Math.PI / 180) * radius;
      var sz = Math.cos(a * Math.PI / 180) * radius - radius * 0.85;
      var sy = (i - (n - 1) / 2) * 70;
      var tx = (i - (n - 1) / 2) * step;
      var x = sx + (tx - sx) * e;
      var y = sy * (1 - e);
      var z = sz * (1 - e);
      var ry = a * (1 - e);
      card.style.transform = "translate3d(" + x + "px," + y + "px," + z + "px) rotateY(" + ry + "deg)";
      card.style.opacity = String(0.55 + 0.45 * (z > -100 || e > 0.6 ? 1 : 0.4));
    });
    if (axis) axis.style.opacity = String(e);
  }
  placeSpiral();
  window.addEventListener("scroll", placeSpiral, { passive: true });
  window.addEventListener("resize", function () { placeSpiral(); layoutRing(); });

  /* Footer underline */
  var foot = document.querySelector("footer");
  if (foot) {
    if (!motionOn() || !("IntersectionObserver" in window)) foot.classList.add("in");
    else {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) foot.classList.add("in");
        });
      }, { threshold: 0.3 }).observe(foot);
    }
  }

  /* Current section in the nav */
  var navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
  var sections = navLinks.map(function (link) {
    return document.getElementById(link.getAttribute("href").slice(1));
  }).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    var current = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          if (link.getAttribute("href") === "#" + entry.target.id) link.setAttribute("aria-current", "page");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (section) { current.observe(section); });
  }

  reduceQuery.addEventListener("change", function () {
    startCycle();
    armEntrance();
    placeSpiral();
    layoutRing();
    go(galIndex);
    ensureWave();
  });
  narrowQuery.addEventListener("change", function () {
    placeSpiral();
    layoutRing();
    go(galIndex);
  });
  phoneQuery.addEventListener("change", layoutRing);
})();
