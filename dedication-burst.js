(function () {
  "use strict";

  var canvas = document.getElementById("dedication-burst");
  var dedication = document.getElementById("dedication");
  var lead = document.getElementById("dedication-lead");
  var name = document.getElementById("dedication-name");
  if (!canvas || !dedication || !lead || !name) return;

  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0;
  var H = 0;
  var particles = [];
  var rafId = 0;
  var startedAt = 0;
  var lastFrame = 0;
  var dissolving = false;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawText(g, el) {
    var rect = el.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return;
    var style = window.getComputedStyle(el);
    var text = el.textContent.trim();
    g.font =
      style.fontStyle + " " + style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
    g.textAlign = "center";

    var size = parseFloat(style.fontSize) || 16;
    var paddingTop = parseFloat(style.paddingTop) || 0;
    var paddingBottom = parseFloat(style.paddingBottom) || 0;
    var lineHeight = parseFloat(style.lineHeight);
    if (!(lineHeight > 0)) lineHeight = size * 1.2;

    var contentHeight = rect.height - paddingTop - paddingBottom;
    var lineCount = Math.max(1, Math.round(contentHeight / lineHeight));
    var x = rect.left + rect.width / 2;
    var y;

    if (lineCount > 1) {
      g.textBaseline = "middle";
      y = rect.top + rect.height / 2;
    } else {
      g.textBaseline = "alphabetic";
      var metrics = g.measureText(text || "M");
      var ascent = metrics.fontBoundingBoxAscent;
      var descent = metrics.fontBoundingBoxDescent;
      if (!(ascent > 0) || !(descent >= 0)) {
        ascent = size * 0.8;
        descent = size * 0.2;
      }
      y = rect.top + paddingTop + (lineHeight - ascent - descent) / 2 + ascent;
    }

    if (el === name) {
      var grad = g.createLinearGradient(rect.left, rect.top, rect.right, rect.bottom);
      grad.addColorStop(0, "#fff4fa");
      grad.addColorStop(0.22, "#ffd8eb");
      grad.addColorStop(0.51, "#ff9dd0");
      grad.addColorStop(0.76, "#ff63b2");
      grad.addColorStop(1, "#ffd7ec");
      g.fillStyle = grad;
    } else {
      g.fillStyle = "#fff0f8";
    }

    g.fillText(text, x, y);
  }

  function build() {
    var off = document.createElement("canvas");
    off.width = Math.max(1, Math.floor(W));
    off.height = Math.max(1, Math.floor(H));
    var g = off.getContext("2d");
    g.clearRect(0, 0, off.width, off.height);
    drawText(g, lead);
    drawText(g, name);

    var data = g.getImageData(0, 0, off.width, off.height).data;
    var step = reduceMotion ? 4 : 2;
    var found = [];

    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        var index = (y * off.width + x) * 4;
        var alpha = data[index + 3];
        if (alpha < 100) continue;
        found.push({
          x: x + (Math.random() - 0.5) * step,
          y: y + (Math.random() - 0.5) * step,
          color: "rgb(" + data[index] + "," + data[index + 1] + "," + data[index + 2] + ")",
          alpha: Math.min(1, alpha / 150 + 0.12)
        });
      }
    }

    if (!found.length) return;

    var max = reduceMotion ? 1400 : W < 640 ? 2800 : 5200;
    var stride = Math.max(1, Math.ceil(found.length / max));
    if (stride > 1) {
      var picked = [];
      for (var i = 0; i < found.length; i += stride) picked.push(found[i]);
      found = picked;
    }

    var leadRect = lead.getBoundingClientRect();
    var nameRect = name.getBoundingClientRect();
    var cx = (leadRect.left + leadRect.right) / 2;
    var cy = (leadRect.top + nameRect.bottom) / 2;
    var spread = Math.max(leadRect.width, nameRect.width) * 0.5;
    if (spread <= 1) spread = 1;

    particles = found.map(function (p) {
      var dx = (p.x - cx) / spread;
      var dy = (p.y - cy) / spread;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var force = (reduceMotion ? 22 : 70) + Math.random() * (reduceMotion ? 40 : 220);
      return {
        x: p.x,
        y: p.y,
        vx: (dx / dist) * force + (Math.random() - 0.5) * 40,
        vy: (dy / dist) * force - 20 - Math.random() * 40,
        size: step * (0.9 + Math.random() * 0.7),
        color: p.color,
        alpha: p.alpha,
        delay: reduceMotion ? 0 : Math.random() * 0.18
      };
    });
  }

  function frame(ts) {
    var dt = Math.min(0.05, (ts - lastFrame) / 1000);
    lastFrame = ts;
    var t = (ts - startedAt) / 1000;

    ctx.clearRect(0, 0, W, H);

    var alive = 0;
    for (var i = 0; i < particles.length; i += 1) {
      var p = particles[i];
      var age = t - p.delay;

      if (age > 0) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 220 * dt;
        p.vx *= Math.exp(-0.7 * dt);
        p.vy *= Math.exp(-0.25 * dt);
      }

      var life = age <= 0 ? 1 : 1 - age / (reduceMotion ? 1.2 : 1.9);
      if (life <= 0 || p.y > H + 20) continue;
      alive += 1;

      ctx.globalAlpha = Math.min(1, life) * p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }

    if (alive > 0 && t < (reduceMotion ? 1.6 : 3)) {
      rafId = window.requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, W, H);
      particles = [];
      rafId = 0;
    }
  }

  function dissolve() {
    if (dissolving) return;
    if (!dedication.classList.contains("is-visible")) return;

    resize();
    build();
    if (!particles.length) return;

    dissolving = true;
    dedication.classList.add("is-dissolving");
    startedAt = performance.now();
    lastFrame = startedAt;
    rafId = window.requestAnimationFrame(frame);
  }

  function reset() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    particles = [];
    ctx.clearRect(0, 0, W, H);
    dissolving = false;
    if (dedication.classList.contains("is-dissolving")) {
      dedication.classList.remove("is-dissolving");
    }
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    var target = event.target;
    if (target && target.closest && target.closest("button, a, .controls")) return;
    dissolve();
  }

  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("keydown", function (event) {
    if (event.key === " " || event.key === "Enter") dissolve();
  });
  window.addEventListener("resize", resize);

  new MutationObserver(function () {
    if (!dedication.classList.contains("is-visible")) reset();
  }).observe(dedication, { attributes: true, attributeFilter: ["class"] });

  resize();
})();



