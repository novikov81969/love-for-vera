(() => {
  "use strict";

  const TAU = Math.PI * 2;

  const DEFAULTS = {
    name: "любимая!",
    finalTitle: "С Днём Рождения,",
    particles: {
      desktop: 2600,
      tablet: 2000,
      mobile: 1500,
      min: 700,
      max: 3400,
      fallSpeed: 34,
      drift: 7,
      reducedMotionFactor: 0.42
    },
    colors: {
      palette: [
        { color: "#ff3d9a", weight: 28 },
        { color: "#ff7ac8", weight: 23 },
        { color: "#ffd0e9", weight: 15 },
        { color: "#ffffff", weight: 10 },
        { color: "#b96dff", weight: 14 },
        { color: "#ff1f6e", weight: 10 }
      ],
      heart: [
        { color: "#ff4fa3", weight: 32 },
        { color: "#ff8fca", weight: 26 },
        { color: "#ffd9ed", weight: 20 },
        { color: "#ffffff", weight: 12 },
        { color: "#e0409a", weight: 10 }
      ]
    },
    heart: {
      size: 1,
      widthFactor: 0.72,
      portraitWidthFactor: 0.9,
      heightRatio: 0.88,
      edgeRatio: 0.46,
      flowParticles: 0.1,
      beatDuration: 1.28
    },
    text: {
      fontFamily: '"Arial Black", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      maxWidth: 0.64,
      maxHeight: 0.36,
      centerY: 0.47
    },
    codeRain: {
      enabled: true,
      opacity: 0.62,
      fontSize: 17,
      speed: 1,
      density: 0.9,
      trailLength: 20,
      phrases: [
        "I Love You, I adore you",
        "I’m crazy about you",
        "You mean the world to me",
        "I’m so into you",
        "You’re my everything",
        "I cherish you",
        "I’m falling for you",
        "You hold my heart",
        "I’m yours forever",
        "My heart beats for you"
      ],
      phraseFontSize: 22,
      phraseOpacity: 0.95,
      phraseSpeed: 1,
      words: ["love", "you", "are", "my", "heart", "true"],
      glyphs: "01{}[]<>/\\|=+-*&%$#@!?ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    },
    sequence: {
      intro: 4.2,
      words: [
        { text: "3", form: 1.0, hold: 1.25, dissolve: 0.65, countdown: true },
        { text: "2", form: 1.0, hold: 1.25, dissolve: 0.65, countdown: true },
        { text: "1", form: 1.0, hold: 1.25, dissolve: 0.65, countdown: true },
        { text: "You", form: 2.3, hold: 1.4, dissolve: 1.0 },
        { text: "Are", form: 2.0, hold: 1.1, dissolve: 1.0 },
        { text: "My", form: 1.9, hold: 1.0, dissolve: 1.0 },
        { text: "Love", form: 2.7, hold: 2.1, dissolve: 1.5 }
      ],
      heart: { form: 3.3, hold: 13, dissolve: 2.4 }
    },
    interaction: {
      cursorRadius: 115,
      tapRadius: 210,
      repelStrength: 900,
      tapStrength: 430
    },
    reducedMotion: {
      speedFactor: 0.45
    }
  };

  function mergeConfig(base, extra) {
    const output = { ...base };
    if (!extra || typeof extra !== "object") return output;
    Object.keys(extra).forEach((key) => {
      const value = extra[key];
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        base[key] &&
        typeof base[key] === "object" &&
        !Array.isArray(base[key])
      ) {
        output[key] = mergeConfig(base[key], value);
      } else if (value !== undefined) {
        output[key] = value;
      }
    });
    return output;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function cleanName(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40) || "Verochka";
  }

  function numeric(value, fallback, min = -Infinity, max = Infinity) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return clamp(number, min, max);
  }

  function parseColor(value) {
    if (typeof value !== "string") return null;
    let hex = value.trim().replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex.split("").map((char) => char + char).join("");
    }
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  const CONFIG = mergeConfig(DEFAULTS, window.LOVE_CONFIG || {});
  const params = new URLSearchParams(window.location.search);
  const queryName = params.get("name");
  const loverName = cleanName(queryName || CONFIG.name || "Verochka");
  const finalTitle = String(CONFIG.finalTitle || "I Love You,").trim() || "I Love You,";

  const canvas = document.getElementById("particles");
  const ctx = canvas ? canvas.getContext("2d", { alpha: true, desynchronized: true }) : null;
  const codeRainCanvas = document.getElementById("code-rain");
  const codeRainCtx = codeRainCanvas
    ? codeRainCanvas.getContext("2d", { alpha: true, desynchronized: true })
    : null;
  const dedication = document.getElementById("dedication");
  const dedicationLead = document.getElementById("dedication-lead");
  const dedicationName = document.getElementById("dedication-name");
  const heartAura = document.getElementById("heart-aura");
  const hint = document.getElementById("hint");
  const hintLabel = document.getElementById("hint-label");
  const replayButton = document.getElementById("replay");
  const fullscreenButton = document.getElementById("fullscreen");
  const liveMessage = document.getElementById("live-message");

  if (!canvas || !ctx || !dedication || !dedicationLead || !dedicationName || !heartAura) return;

  const body = document.body;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  const isCoarsePointer = coarsePointerQuery.matches;

  document.title = `${finalTitle} ${loverName}`;
  dedicationLead.textContent = finalTitle;
  dedicationName.textContent = loverName;
  hintLabel.textContent = isCoarsePointer ? "коснись света" : "двигай курсором · коснись света";

  const ambientPalette = normalizePalette(CONFIG.colors && CONFIG.colors.palette, "#ff4fa3");
  const heartPalette = normalizePalette(CONFIG.colors && CONFIG.colors.heart, "#ff7ac8");

  function normalizePalette(list, fallbackColor) {
    const source = Array.isArray(list) && list.length ? list : [{ color: fallbackColor, weight: 1 }];
    return source.map((item) => {
      const rawColor = typeof item === "string" ? item : item && item.color;
      const color = parseColor(rawColor) || parseColor(fallbackColor) || { r: 255, g: 79, b: 163 };
      const weight = typeof item === "object" && item && Number(item.weight) > 0 ? Number(item.weight) : 1;
      return { ...color, weight };
    });
  }

  function pickPaletteIndex(palette) {
    let total = 0;
    for (let i = 0; i < palette.length; i += 1) total += palette[i].weight;
    let roll = Math.random() * total;
    for (let i = 0; i < palette.length; i += 1) {
      roll -= palette[i].weight;
      if (roll <= 0) return i;
    }
    return palette.length - 1;
  }

  function makeSprite(color, star) {
    const sprite = document.createElement("canvas");
    const size = star ? 96 : 64;
    const center = size / 2;
    sprite.width = size;
    sprite.height = size;
    const spriteCtx = sprite.getContext("2d");
    const { r, g, b } = color;
    const glow = spriteCtx.createRadialGradient(center, center, 0, center, center, center);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.07, `rgba(${r},${g},${b},0.98)`);
    glow.addColorStop(0.18, `rgba(${r},${g},${b},0.72)`);
    glow.addColorStop(0.38, `rgba(${r},${g},${b},0.24)`);
    glow.addColorStop(0.68, `rgba(${r},${g},${b},0.06)`);
    glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
    spriteCtx.fillStyle = glow;
    spriteCtx.fillRect(0, 0, size, size);

    if (star) {
      spriteCtx.globalCompositeOperation = "lighter";
      const horizontal = spriteCtx.createLinearGradient(0, center, size, center);
      horizontal.addColorStop(0, `rgba(${r},${g},${b},0)`);
      horizontal.addColorStop(0.34, `rgba(${r},${g},${b},0.25)`);
      horizontal.addColorStop(0.5, "rgba(255,255,255,0.92)");
      horizontal.addColorStop(0.66, `rgba(${r},${g},${b},0.25)`);
      horizontal.addColorStop(1, `rgba(${r},${g},${b},0)`);
      spriteCtx.fillStyle = horizontal;
      spriteCtx.fillRect(0, center - 0.7, size, 1.4);

      const vertical = spriteCtx.createLinearGradient(center, 0, center, size);
      vertical.addColorStop(0, `rgba(${r},${g},${b},0)`);
      vertical.addColorStop(0.34, `rgba(${r},${g},${b},0.25)`);
      vertical.addColorStop(0.5, "rgba(255,255,255,0.92)");
      vertical.addColorStop(0.66, `rgba(${r},${g},${b},0.25)`);
      vertical.addColorStop(1, `rgba(${r},${g},${b},0)`);
      spriteCtx.fillStyle = vertical;
      spriteCtx.fillRect(center - 0.7, 0, 1.4, size);
    }

    return sprite;
  }

  function makeSpriteSet(palette) {
    return {
      glow: palette.map((color) => makeSprite(color, false)),
      star: palette.map((color) => makeSprite(color, true))
    };
  }

  const ambientSprites = makeSpriteSet(ambientPalette);
  const heartSprites = makeSpriteSet(heartPalette);

  const state = {
    w: Math.max(1, window.innerWidth),
    h: Math.max(1, window.innerHeight),
    dpr: 1,
    time: 0,
    fade: 0,
    reduced: reduceMotionQuery.matches,
    pointer: {
      active: false,
      down: false,
      x: 0,
      y: 0,
      lastX: 0,
      lastY: 0
    },
    camera: { x: 0, y: 0 },
    heartLayout: null,
    heartPoly: null,
    heartCanTap: false,
    heartBeat: 0,
    tapBoost: 0,
    targetPool: null,
    targetKind: null
  };

  let particles = [];
  let perfScale = 1;
  let hintDismissed = false;
  let tapAnimationTimer = 0;
  let resizeRaf = 0;
  let resizeTimer = 0;
  const waves = [];

  const perf = {
    elapsed: 0,
    frames: 0,
    lowStreak: 0,
    highStreak: 0
  };

  let scenes = [];
  const runtime = {
    index: 0,
    elapsed: 0,
    dissolveStarted: false,
    labelShown: false,
    scene: null,
    cycle: 1
  };

  const rain = {
    fontSize: 17,
    rowHeight: 20,
    phraseFontSize: 19,
    dpr: 1,
    columns: [],
    phrases: [],
    phraseDrops: [],
    phraseCount: 0,
    level: 0,
    wasVisible: false
  };

  const textCanvas = document.createElement("canvas");
  const textContext = textCanvas.getContext("2d", { willReadFrequently: true });

  function fallSpeed() {
    const factor = state.reduced
      ? numeric(CONFIG.reducedMotion && CONFIG.reducedMotion.speedFactor, 0.45, 0.1, 1)
      : 1;
    return numeric(CONFIG.particles.fallSpeed, 34, 0, 240) * (state.h / 900) * factor;
  }

  function initialY() {
    const roll = Math.random();
    if (roll < 0.5) return randomBetween(-state.h * 0.18, state.h * 0.23);
    if (roll < 0.96) return randomBetween(state.h * 0.75, state.h * 1.12);
    return randomBetween(0, state.h);
  }

  function gaussianRandom() {
    const first = Math.max(0.0001, 1 - Math.random());
    const second = Math.random();
    return Math.sqrt(-2 * Math.log(first)) * Math.cos(TAU * second);
  }

  function initialPosition() {
    let x = randomBetween(-30, state.w + 30);
    let y = initialY();

    if (Math.random() < 0.58) {
      const top = Math.random() < 0.5;
      const side = Math.random() < 0.5 ? 0.17 : 0.83;
      x = state.w * side + gaussianRandom() * state.w * 0.065;
      y = state.h * (top ? randomBetween(0.04, 0.17) : randomBetween(0.82, 0.98)) +
        gaussianRandom() * state.h * 0.055;
      x = clamp(x, -25, state.w + 25);
    }

    return { x, y };
  }

  function createParticle(initial) {
    const depth = 0.2 + Math.pow(Math.random(), 1.25) * 0.8;
    const position = initial ? initialPosition() : null;
    return {
      x: position ? position.x : randomBetween(-30, state.w + 30),
      y: position ? position.y : randomBetween(-state.h * 0.1, state.h),
      vx: randomBetween(-2, 2),
      vy: randomBetween(-2, 2),
      depth,
      size: (0.7 + depth * 1.3) * (Math.random() < 0.07 ? 1.45 : 1),
      alpha: 0.14 + depth * 0.58,
      twinkleSpeed: randomBetween(0.8, 3.1),
      twinkleFloor: Math.random() < 0.2 ? randomBetween(0.08, 0.2) : randomBetween(0.5, 0.68),
      phase: Math.random() * TAU,
      swaySpeed: randomBetween(0.22, 0.72),
      fallMultiplier: randomBetween(0.58, 1.42),
      colorIndex: pickPaletteIndex(ambientPalette),
      heartColorIndex: pickPaletteIndex(heartPalette),
      flare: Math.random() < 0.065,
      star: Math.random() < 0.24,
      formMix: 0,
      delay: 0,
      spring: 1,
      target: null,
      tx: 0,
      ty: 0
    };
  }

  function computeBaseBudget() {
    const areaRatio = clamp((state.w * state.h) / (1440 * 900), 0.65, 1.35);
    let base;
    if (state.w <= 720 || (isCoarsePointer && Math.min(state.w, state.h) < 820)) {
      base = numeric(CONFIG.particles.mobile, 1350, 100, 6000);
    } else if (state.w <= 1180 || isCoarsePointer) {
      base = numeric(CONFIG.particles.tablet, 2000, 100, 6000);
    } else {
      base = numeric(CONFIG.particles.desktop, 2600, 100, 8000);
    }

    let count = base * areaRatio;
    const cores = Number(navigator.hardwareConcurrency) || 8;
    const memory = Number(navigator.deviceMemory) || 8;
    if (cores <= 4) count *= 0.82;
    if (memory <= 4) count *= 0.9;

    return Math.round(
      clamp(
        count,
        numeric(CONFIG.particles.min, 700, 100, 8000),
        numeric(CONFIG.particles.max, 3400, 100, 12000)
      )
    );
  }

  function currentBudget() {
    let count = computeBaseBudget() * perfScale;
    if (state.reduced) {
      count *= numeric(CONFIG.particles.reducedMotionFactor, 0.42, 0.1, 1);
    }
    return Math.max(state.reduced ? 280 : 360, Math.round(count));
  }

  function syncParticleCount(target) {
    const count = Math.max(80, Math.round(target));
    while (particles.length > count) {
      let removeIndex = -1;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        if (!particles[i].target) {
          removeIndex = i;
          break;
        }
      }
      if (removeIndex < 0) removeIndex = particles.length - 1;
      particles.splice(removeIndex, 1);
    }

    while (particles.length < count) {
      const particle = createParticle(false);
      if (
        state.targetPool &&
        state.targetPool.length &&
        state.targetKind &&
        runtime.scene &&
        runtime.scene.type !== "intro" &&
        !runtime.dissolveStarted
      ) {
        const point = state.targetPool[Math.floor(Math.random() * state.targetPool.length)];
        assignTarget(particle, point, state.targetKind);
      }
      particles.push(particle);
    }
  }

  function preferredDpr(width) {
    return Math.min(window.devicePixelRatio || 1, width < 720 ? 3 : 2);
  }

  function resizeCanvas() {
    const oldW = state.w;
    const oldH = state.h;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const dpr = preferredDpr(width);

    state.w = width;
    state.h = height;
    state.dpr = dpr;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    setupCodeRain();

    if (oldW > 0 && oldH > 0 && (oldW !== width || oldH !== height)) {
      const scaleX = width / oldW;
      const scaleY = height / oldH;
      particles.forEach((particle) => {
        particle.x *= scaleX;
        particle.y *= scaleY;
        particle.tx *= scaleX;
        particle.ty *= scaleY;
        if (particle.target && particle.target.kind === "heart") {
          particle.target.ox *= scaleX;
          particle.target.oy *= scaleY;
        }
      });
    }

    layoutDedication();
  }

  function scheduleResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      resizeCanvas();
      layoutDedication();
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        rebuildActiveTargets();
        syncParticleCount(currentBudget());
      }, 170);
    });
  }

  function rainSettings() {
    return CONFIG.codeRain || {};
  }

  function resetRainColumn(column, spread) {
    const settings = rainSettings();
    const speed = numeric(settings.speed, 1, 0.1, 4);
    const trailBase = numeric(settings.trailLength, 20, 5, 48);
    const heightScale = clamp(state.h / 900, 0.65, 1.45);

    column.y = spread
      ? randomBetween(-state.h * 1.05, state.h * 0.95)
      : randomBetween(-state.h * 0.8, -rain.rowHeight * 2);
    column.speed = randomBetween(48, 150) * speed * heightScale;
    column.trail = Math.max(4, Math.round(trailBase * randomBetween(0.55, 1.2)));
    column.seed = Math.floor(Math.random() * 997);
    column.accent = Math.floor(Math.random() * 3);
    column.word =
      !rain.phrases.length && rain.words.length && Math.random() < 0.09
        ? rain.words[Math.floor(Math.random() * rain.words.length)]
        : "";
  }

  function resetRainPhrase(drop, spread) {
    if (!rain.phrases.length) {
      drop.phrase = "";
      return;
    }

    const settings = rainSettings();
    const activePhrases = new Set();
    for (let i = 0; i < rain.phraseDrops.length; i += 1) {
      const other = rain.phraseDrops[i];
      if (other !== drop && other.phrase) activePhrases.add(other.phrase);
    }

    const available = rain.phrases.filter((phrase) => !activePhrases.has(phrase));
    const pool = available.length ? available : rain.phrases;
    drop.phrase = pool[Math.floor(Math.random() * pool.length)];
    drop.chars = Array.from(drop.phrase);
    drop.size = Math.max(11, Math.round(rain.phraseFontSize * randomBetween(0.96, 1.06)));
    drop.lineHeight = Math.round(drop.size * 1.22);
    drop.height = drop.chars.length * drop.lineHeight;

    if (drop.height > state.h * 0.94) {
      drop.size = Math.max(
        10,
        Math.floor(drop.size * ((state.h * 0.94) / drop.height))
      );
      drop.lineHeight = Math.round(drop.size * 1.22);
      drop.height = drop.chars.length * drop.lineHeight;
    }

    const laneWidth = state.w / Math.max(1, rain.phraseCount);
    const lane = Number.isFinite(drop.lane) ? drop.lane : 0;
    drop.x = clamp(
      (lane + 0.5) * laneWidth + randomBetween(-laneWidth * 0.18, laneWidth * 0.18),
      8,
      state.w - drop.size - 8
    );
    drop.y = spread
      ? randomBetween(-drop.height * 0.18, Math.max(0, state.h - drop.height - 12))
      : randomBetween(-drop.height - drop.lineHeight, -drop.lineHeight * 2);
    drop.speed =
      randomBetween(32, 72) *
      numeric(settings.phraseSpeed, 1, 0.2, 4) *
      clamp(state.h / 900, 0.7, 1.3);
    drop.accent = Math.floor(Math.random() * 3);
    drop.alpha = randomBetween(0.72, 1);
  }

  function setupCodeRain() {
    if (!codeRainCanvas || !codeRainCtx) return;

    const settings = rainSettings();
    const dpr = Math.min(preferredDpr(state.w), 2);
    rain.dpr = dpr;
    rain.fontSize = Math.max(
      10,
      Math.round(
        numeric(settings.fontSize, 17, 10, 36) * (state.w < 680 ? 0.84 : 1)
      )
    );
    rain.rowHeight = Math.round(rain.fontSize * 1.2);

    const rawGlyphs = Array.from(String(settings.glyphs || "01<>{}[]"));
    rain.glyphs = rawGlyphs.filter((glyph) => glyph.trim().length);
    if (!rain.glyphs.length) rain.glyphs = ["0", "1"];

    rain.words = (Array.isArray(settings.words) ? settings.words : [])
      .map((word) => String(word || "").trim().slice(0, 12))
      .filter(Boolean);

    rain.phrases = (Array.isArray(settings.phrases) ? settings.phrases : [])
      .map((phrase) => String(phrase || "").replace(/\s+/g, " ").trim().slice(0, 90))
      .filter(Boolean);
    rain.phraseFontSize = Math.max(
      12,
      Math.round(
        numeric(settings.phraseFontSize, 19, 10, 40) * (state.w < 680 ? 0.74 : 1)
      )
    );

    const longestPhrase = rain.phrases.reduce(
      (longest, phrase) => Math.max(longest, Array.from(phrase).length),
      0
    );
    const tallestPhrase = longestPhrase * rain.phraseFontSize * 1.22;
    if (tallestPhrase > state.h * 0.94) {
      rain.phraseFontSize = Math.max(
        10,
        Math.floor(rain.phraseFontSize * ((state.h * 0.94) / tallestPhrase))
      );
    }

    codeRainCanvas.width = Math.round(state.w * dpr);
    codeRainCanvas.height = Math.round(state.h * dpr);
    codeRainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    codeRainCtx.clearRect(0, 0, state.w, state.h);

    const columnWidth = rain.fontSize * 1.12;
    const density = numeric(settings.density, 0.9, 0.2, 1.6);
    const count = Math.max(
      10,
      Math.min(170, Math.round((state.w / columnWidth) * density))
    );

    rain.columns = [];
    for (let i = 0; i < count; i += 1) {
      const column = { x: ((i + 0.5) / count) * state.w };
      resetRainColumn(column, true);
      rain.columns.push(column);
    }

    const phraseCount = rain.phrases.length
      ? Math.min(
          rain.phrases.length,
          state.w < 680 ? 6 : Math.round(clamp(state.w / 145, 6, 10))
        )
      : 0;

    rain.phraseCount = phraseCount;
    rain.phraseDrops = [];
    for (let i = 0; i < phraseCount; i += 1) {
      const drop = { lane: i };
      resetRainPhrase(drop, true);
      rain.phraseDrops.push(drop);
    }
  }

  function rainGlyph(column, row) {
    const length = rain.glyphs.length;
    let value = Math.imul(row, 374761393) + Math.imul(column.seed, 668265263);
    value = Math.imul(value ^ (value >>> 13), 1274126177);
    value ^= value >>> 16;
    return rain.glyphs[(value >>> 0) % length];
  }

  function clearCodeRain() {
    if (!codeRainCtx) return;
    codeRainCtx.setTransform(rain.dpr, 0, 0, rain.dpr, 0, 0);
    codeRainCtx.clearRect(0, 0, state.w, state.h);
    rain.wasVisible = false;
  }

  function updateCodeRain(dt) {
    if (!codeRainCtx || !codeRainCanvas) return;

    const settings = rainSettings();
    const scene = runtime.scene;
    let target = 0;
    if (settings.enabled !== false && scene && !runtime.dissolveStarted) {
      if (scene.type === "intro") target = 1;
      else if (scene.countdown) target = 0.28;
    }

    const response = target > rain.level ? 2.1 : 4.4;
    rain.level += (target - rain.level) * (1 - Math.exp(-dt * response));

    if (rain.level < 0.002) {
      rain.level = 0;
      if (rain.wasVisible) clearCodeRain();
      return;
    }

    rain.wasVisible = true;
    const speedFactor = state.reduced ? 0.35 : 1;

    for (let i = 0; i < rain.columns.length; i += 1) {
      const column = rain.columns[i];
      column.y += column.speed * dt * speedFactor;

      if (column.y - (column.trail - 1) * rain.rowHeight > state.h + 40) {
        resetRainColumn(column, false);
      }
    }

    for (let i = 0; i < rain.phraseDrops.length; i += 1) {
      const drop = rain.phraseDrops[i];
      drop.y += drop.speed * dt * speedFactor;

      if (drop.y > state.h + drop.lineHeight) {
        resetRainPhrase(drop, false);
      }
    }
  }

  function renderCodeRain() {
    if (!codeRainCtx || rain.level <= 0.002) return;

    const settings = rainSettings();
    const opacity = numeric(settings.opacity, 0.62, 0, 1) * rain.level;
    if (opacity <= 0.002) return;

    const rainCtx = codeRainCtx;
    const colors = ["rgb(255, 72, 153)", "rgb(255, 132, 196)", "rgb(190, 104, 255)"];

    rainCtx.setTransform(rain.dpr, 0, 0, rain.dpr, 0, 0);
    rainCtx.clearRect(0, 0, state.w, state.h);
    rainCtx.globalCompositeOperation = "lighter";
    rainCtx.textAlign = "left";
    rainCtx.textBaseline = "top";
    rainCtx.font = `500 ${rain.fontSize}px "Cascadia Mono", Consolas, "Courier New", monospace`;

    for (let i = 0; i < rain.columns.length; i += 1) {
      const column = rain.columns[i];
      const headRow = Math.floor(column.y / rain.rowHeight);
      const firstRow = Math.max(0, headRow - column.trail + 1);

      for (let row = firstRow; row <= headRow; row += 1) {
        const step = headRow - row;
        const py = row * rain.rowHeight;
        if (py < -rain.rowHeight || py > state.h) continue;

        const head = step === 0;
        const fade = Math.pow(1 - step / column.trail, 1.65);
        let alpha = opacity * fade;
        if (head) alpha = Math.min(1, alpha * 1.65);
        if (alpha < 0.012) continue;

        const glyph = head && column.word ? column.word : rainGlyph(column, row);

        rainCtx.globalAlpha = alpha;
        rainCtx.fillStyle = head ? "rgb(255, 244, 250)" : colors[column.accent];
        if (head && !state.reduced) {
          rainCtx.shadowBlur = 10;
          rainCtx.shadowColor = "rgba(255, 54, 148, 0.85)";
        } else {
          rainCtx.shadowBlur = 0;
        }
        rainCtx.fillText(glyph, column.x, head ? column.y : py);
      }
    }

    const phraseOpacity =
      numeric(settings.phraseOpacity, 0.92, 0, 1) * rain.level;

    if (rain.phraseDrops.length && phraseOpacity > 0.002) {
      const phraseColors = ["rgb(255, 236, 246)", "rgb(255, 184, 220)", "rgb(226, 190, 255)"];
      const phraseGlows = [
        "rgba(255, 78, 161, 0.8)",
        "rgba(255, 54, 148, 0.75)",
        "rgba(190, 104, 255, 0.72)"
      ];

      rainCtx.globalCompositeOperation = "source-over";

      for (let i = 0; i < rain.phraseDrops.length; i += 1) {
        const drop = rain.phraseDrops[i];
        if (drop.y > state.h || drop.y + drop.height < 0) continue;

        rainCtx.font = `600 ${drop.size}px "Cascadia Mono", Consolas, "Courier New", monospace`;
        rainCtx.globalAlpha = Math.min(1, phraseOpacity * drop.alpha);
        rainCtx.fillStyle = phraseColors[drop.accent];
        rainCtx.shadowBlur = state.reduced ? 3 : 6;
        rainCtx.shadowColor = phraseGlows[drop.accent];

        for (let j = 0; j < drop.chars.length; j += 1) {
          const py = drop.y + j * drop.lineHeight;
          if (py < -drop.lineHeight || py > state.h) continue;
          rainCtx.fillText(drop.chars[j], drop.x, py);
        }
      }
    }

    rainCtx.globalAlpha = 1;
    rainCtx.shadowBlur = 0;
    rainCtx.globalCompositeOperation = "source-over";
  }

  function getHeartLayout() {
    const portrait = state.h > state.w;
    const widthFactor = numeric(
      portrait ? CONFIG.heart.portraitWidthFactor : CONFIG.heart.widthFactor,
      portrait ? 0.9 : 0.72,
      0.2,
      1.2
    );
    const heightRatio = numeric(CONFIG.heart.heightRatio, 0.88, 0.5, 1.6);
    const size = numeric(CONFIG.heart.size, 1, 0.3, 1.8);
    let width = Math.min(state.w * widthFactor, (state.h * 0.78) / heightRatio) * size;
    width = Math.min(width, state.w * 0.95, (state.h * 0.88) / heightRatio);
    return {
      x: state.w * 0.5,
      y: state.h * 0.51,
      width,
      height: width * heightRatio
    };
  }

  function heartPoint(t, layout, scale = 1) {
    const rawX = 16 * Math.pow(Math.sin(t), 3);
    const rawY = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const nx = rawX / 16;
    const ny = (rawY + 2.5) / 14.5;
    return {
      x: layout.x + nx * (layout.width / 2) * scale,
      y: layout.y - ny * (layout.height / 2) * scale
    };
  }

  function makeHeartPolygon(layout) {
    const polygon = [];
    for (let i = 0; i < 220; i += 1) {
      polygon.push(heartPoint((i / 220) * TAU, layout));
    }
    return polygon;
  }

  function pointInPolygon(x, y, polygon) {
    if (!polygon || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = items[i];
      items[i] = items[j];
      items[j] = temp;
    }
    return items;
  }

  function layoutDedication() {
    const layout = getHeartLayout();
    const leadLength = Math.max(5, finalTitle.length);
    const nameLength = Math.max(4, loverName.length);
    const leadSize = clamp(
      Math.min(layout.width * 0.072, (layout.width * 0.7) / (leadLength * 0.54)),
      10,
      92
    );
    const nameSize = clamp(
      Math.min(layout.width * 0.145, (layout.width * 0.7) / (nameLength * 0.5)),
      14,
      160
    );

    dedication.style.left = `${layout.x}px`;
    dedication.style.top = `${layout.y - layout.height * 0.045}px`;
    dedication.style.width = `${Math.min(state.w * 0.92, layout.width * 0.92)}px`;
    dedication.style.setProperty("--heart-width", `${layout.width}px`);
    dedicationLead.style.fontSize = `${leadSize}px`;
    dedicationName.style.fontSize = `${nameSize}px`;

    heartAura.style.left = `${layout.x}px`;
    heartAura.style.top = `${layout.y}px`;
    heartAura.style.width = `${layout.width * 1.8}px`;
    heartAura.style.height = `${layout.height * 1.55}px`;
  }

  function assignTarget(particle, point, kind, preserve = false) {
    const layout = state.heartLayout;
    const jitterX = randomBetween(-0.35, 0.35);
    const jitterY = randomBetween(-0.35, 0.35);
    particle.target = {
      kind,
      edge: Boolean(point.edge),
      flow: Boolean(point.flow),
      angle: Number(point.angle) || 0,
      speed: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.055, 0.12),
      swirl: (Math.random() < 0.5 ? -1 : 1) * randomBetween(0.16, 0.4),
      ox: kind === "heart" && layout ? point.x - layout.x : 0,
      oy: kind === "heart" && layout ? point.y - layout.y : 0,
      shimmer: point.edge ? 0.5 : 0.3
    };
    const countdown = Boolean(runtime.scene && runtime.scene.countdown);
    particle.tx = point.x + jitterX;
    particle.ty = point.y + jitterY;
    particle.delay = preserve
      ? 0
      : randomBetween(0, kind === "heart" ? 0.85 : countdown ? 0.12 : 0.6);
    particle.spring = randomBetween(0.82, 1.22);
    particle.formMix = preserve ? Math.max(particle.formMix, 0.55) : 0;
    if (!preserve) {
      particle.vx *= 0.35;
      particle.vy *= 0.35;
    }
  }

  function sampleText(text) {
    const width = Math.ceil(state.w);
    const height = Math.ceil(state.h);
    textCanvas.width = width;
    textCanvas.height = height;
    textContext.clearRect(0, 0, width, height);

    const baseSize = 100;
    const family = CONFIG.text.fontFamily || '"Arial Black", "Segoe UI", Arial, sans-serif';
    textContext.font = `900 ${baseSize}px ${family}`;
    const metrics = textContext.measureText(text);
    const widthRatio = Math.max(0.1, metrics.width / baseSize);
    const ascent = metrics.actualBoundingBoxAscent || baseSize * 0.72;
    const descent = metrics.actualBoundingBoxDescent || baseSize * 0.2;
    const heightRatio = Math.max(0.1, (ascent + descent) / baseSize);
    const maxWidthFactor = state.w < 680
      ? Math.min(0.9, numeric(CONFIG.text.maxWidth, 0.64, 0.2, 0.95) + 0.2)
      : numeric(CONFIG.text.maxWidth, 0.64, 0.2, 0.95);
    const maxWidth = state.w * maxWidthFactor;
    const maxHeight = state.h * numeric(CONFIG.text.maxHeight, 0.36, 0.1, 0.7);
    const fontSize = Math.max(32, Math.min(maxWidth / widthRatio, maxHeight / heightRatio));

    textContext.font = `900 ${fontSize}px ${family}`;
    textContext.textAlign = "center";
    textContext.textBaseline = "middle";
    textContext.fillStyle = "#ffffff";
    const centerY = state.h * numeric(CONFIG.text.centerY, 0.47, 0.28, 0.72);
    textContext.fillText(text, state.w / 2, centerY);

    const data = textContext.getImageData(0, 0, width, height).data;

    function collectPoints(step) {
      const points = [];
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          if (data[(y * width + x) * 4 + 3] > 118) {
            points.push({ x, y });
          }
        }
      }
      return points;
    }

    let points = collectPoints(2);
    if (points.length < Math.min(1600, particles.length * 0.7)) {
      points = collectPoints(1);
    }

    if (!points.length) {
      points.push({ x: state.w / 2, y: centerY });
    }

    return shuffle(points);
  }

  function buildTextTargets(text, preserve = false) {
    const points = sampleText(text);
    state.targetPool = points;
    state.targetKind = "text";
    state.heartCanTap = false;
    state.heartBeat = 0;
    for (let i = 0; i < particles.length; i += 1) {
      assignTarget(particles[i], points[i % points.length], "text", preserve);
    }
  }

  function buildHeartTargets(preserve = false) {
    const layout = getHeartLayout();
    const polygon = makeHeartPolygon(layout);
    state.heartLayout = layout;
    state.heartPoly = polygon;

    const count = Math.max(1, particles.length);
    const edgeRatio = numeric(CONFIG.heart.edgeRatio, 0.46, 0.1, 0.9);
    const edgeCount = Math.max(8, Math.round(count * edgeRatio));
    const flowConfig = numeric(CONFIG.heart.flowParticles, 0.1, 0, 0.6);
    const flowChance = clamp(flowConfig / edgeRatio, 0, 0.7);
    const points = [];

    for (let i = 0; i < edgeCount; i += 1) {
      const angle = (i / edgeCount) * TAU + randomBetween(-0.002, 0.002);
      const thickness = 1 + randomBetween(-0.006, 0.009) + (Math.random() < 0.08 ? 0.01 : 0);
      const point = heartPoint(angle, layout, thickness);
      points.push({
        x: point.x,
        y: point.y,
        edge: true,
        flow: Math.random() < flowChance,
        angle
      });
    }

    let guard = 0;
    while (points.length < count && guard < count * 60) {
      guard += 1;
      const x = layout.x + randomBetween(-0.5, 0.5) * layout.width;
      const y = layout.y + randomBetween(-0.5, 0.5) * layout.height;
      if (pointInPolygon(x, y, polygon)) {
        points.push({ x, y, edge: false, flow: false });
      }
    }

    while (points.length < count) {
      const point = heartPoint(Math.random() * TAU, layout, randomBetween(0.2, 0.9));
      points.push({ x: point.x, y: point.y, edge: false, flow: false });
    }

    shuffle(points);
    state.targetPool = points;
    state.targetKind = "heart";

    for (let i = 0; i < count; i += 1) {
      assignTarget(particles[i], points[i % points.length], "heart", preserve);
    }
  }

  function computeHeartBeat() {
    const duration = numeric(CONFIG.heart.beatDuration, 1.28, 0.6, 4);
    const phase = (state.time % duration) / duration;
    const first = Math.exp(-Math.pow((phase - 0.09) / 0.032, 2));
    const second = 0.55 * Math.exp(-Math.pow((phase - 0.22) / 0.055, 2));
    return first + second;
  }

  function updateHeartTargets() {
    const layout = state.heartLayout;
    if (!layout) return;
    const beat = computeHeartBeat();
    const pulse = 1 + beat * 0.022 + state.tapBoost * 0.055;
    const flowFactor = state.reduced ? 0.45 : 1;
    const shimmerFactor = state.reduced ? 0.45 : 1;

    state.heartBeat = beat;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const target = particle.target;
      if (!target || target.kind !== "heart") continue;

      if (target.flow) {
        const angle = target.angle + state.time * target.speed * flowFactor;
        const point = heartPoint(
          angle,
          layout,
          pulse * (1 + Math.sin(state.time * 1.2 + particle.phase) * 0.004)
        );
        particle.tx = point.x + Math.sin(state.time * 2 + particle.phase) * 0.45 * shimmerFactor;
        particle.ty = point.y + Math.cos(state.time * 1.7 + particle.phase) * 0.45 * shimmerFactor;
      } else {
        const shimmer = target.shimmer * shimmerFactor;
        particle.tx = layout.x + target.ox * pulse + Math.sin(state.time * 1.4 + particle.phase) * shimmer;
        particle.ty = layout.y + target.oy * pulse + Math.cos(state.time * 1.2 + particle.phase) * shimmer;
      }
    }
  }

  function rebuildActiveTargets() {
    const scene = runtime.scene;
    if (!scene || runtime.dissolveStarted) return;
    if (scene.type === "word") {
      buildTextTargets(scene.text, true);
    } else if (scene.type === "heart") {
      buildHeartTargets(true);
      if (runtime.labelShown) {
        dedication.classList.add("is-visible");
        heartAura.classList.add("is-visible");
      }
    }
  }

  function revealFinale() {
    runtime.labelShown = true;
    dedication.classList.add("is-visible");
    dedication.setAttribute("aria-hidden", "false");
    heartAura.classList.add("is-visible");
    if (liveMessage) liveMessage.textContent = `${finalTitle} ${loverName}`;
  }

  function hideFinale() {
    runtime.labelShown = false;
    dedication.classList.remove("is-visible", "is-touched");
    dedication.setAttribute("aria-hidden", "true");
    heartAura.classList.remove("is-visible");
    if (tapAnimationTimer) {
      clearTimeout(tapAnimationTimer);
      tapAnimationTimer = 0;
    }
  }

  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    if (hint) hint.classList.add("is-hidden");
  }

  function buildScenes() {
    const sequence = CONFIG.sequence || {};
    scenes = [
      {
        type: "intro",
        duration: numeric(sequence.intro, 4.2, 0.3, 60)
      }
    ];

    const words = Array.isArray(sequence.words) ? sequence.words : DEFAULTS.sequence.words;
    words.forEach((word) => {
      const text = String((word && word.text) || "").trim().slice(0, 24);
      if (!text) return;
      scenes.push({
        type: "word",
        text,
        countdown: Boolean(word.countdown),
        form: numeric(word.form, 2, 0.3, 30),
        hold: numeric(word.hold, 1, 0, 60),
        dissolve: numeric(word.dissolve, 1, 0.2, 20)
      });
    });

    const heart = sequence.heart || {};
    scenes.push({
      type: "heart",
      form: numeric(heart.form, 3.3, 0.4, 30),
      hold: numeric(heart.hold, 13, 0.5, 120),
      dissolve: numeric(heart.dissolve, 2.4, 0.3, 20)
    });
  }

  function enterScene(index) {
    if (index >= scenes.length) index = 0;
    runtime.index = index;
    runtime.elapsed = 0;
    runtime.dissolveStarted = false;
    runtime.labelShown = false;
    runtime.scene = scenes[index];
    state.targetPool = null;
    state.targetKind = null;

    if (runtime.scene.type === "intro") {
      state.heartCanTap = false;
      state.heartBeat = 0;
      state.heartPoly = null;
      setupCodeRain();
      rain.level = 0;
      rain.wasVisible = false;
      return;
    }

    dismissHint();
    hideFinale();

    if (runtime.scene.type === "word") {
      state.heartPoly = null;
      buildTextTargets(runtime.scene.text);
    } else if (runtime.scene.type === "heart") {
      state.heartCanTap = false;
      buildHeartTargets();
    }
  }

  function nextScene() {
    if (runtime.index + 1 >= scenes.length) {
      runtime.cycle += 1;
      enterScene(0);
    } else {
      enterScene(runtime.index + 1);
    }
  }

  function releaseFormation(explosive, strength = 1) {
    const centerX = (state.heartLayout && state.heartLayout.x) || state.w * 0.5;
    const centerY = (state.heartLayout && state.heartLayout.y) || state.h * 0.5;
    const power = clamp(strength, 0.3, 3);

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      if (!particle.target) continue;
      const dx = particle.x - centerX;
      const dy = particle.y - centerY;
      const length = Math.hypot(dx, dy) || 1;
      particle.target = null;
      particle.delay = 0;
      particle.vx +=
        (dx / length) * (explosive ? 135 : 55) * power +
        randomBetween(-35, 35) * power;
      particle.vy +=
        (dy / length) * (explosive ? 95 : 25) * power +
        randomBetween(20, explosive ? 110 : 70) * power;
    }

    state.targetPool = null;
    state.targetKind = null;
  }

  function updateSequence(dt) {
    const scene = runtime.scene;
    if (!scene) return;
    runtime.elapsed += dt;

    if (scene.type === "intro") {
      if (runtime.elapsed >= scene.duration) nextScene();
      return;
    }

    const formEnd = scene.form;
    const holdEnd = formEnd + scene.hold;
    const total = holdEnd + scene.dissolve;

    if (scene.type === "heart") {
      if (!runtime.dissolveStarted) updateHeartTargets();

      if (!runtime.labelShown && runtime.elapsed >= formEnd * 0.66) {
        revealFinale();
        state.heartCanTap = true;
      }

      if (!runtime.dissolveStarted && runtime.elapsed >= holdEnd) {
        runtime.dissolveStarted = true;
        state.heartCanTap = false;
        hideFinale();
        releaseFormation(true);
      }
    } else if (scene.type === "word") {
      if (!runtime.dissolveStarted && runtime.elapsed >= holdEnd) {
        runtime.dissolveStarted = true;
        releaseFormation(Boolean(scene.countdown), scene.countdown ? 1.65 : 1.2);
      }
    }

    if (runtime.elapsed >= total) nextScene();
  }

  function startTimeline() {
    buildScenes();
    runtime.cycle = 1;
    enterScene(0);
  }

  function restartExperience(showHint) {
    releaseFormation(true);
    hideFinale();
    waves.length = 0;
    state.tapBoost = 0;
    state.heartBeat = 0;
    state.heartCanTap = false;
    if (showHint) {
      hintDismissed = false;
      if (hint) hint.classList.remove("is-hidden");
    }
    enterScene(0);
  }

  function updateCamera(dt) {
    const targetX = state.pointer.active && !state.reduced ? (state.pointer.x / state.w - 0.5) * 26 : 0;
    const targetY = state.pointer.active && !state.reduced ? (state.pointer.y / state.h - 0.5) * 18 : 0;
    const smoothing = 1 - Math.exp(-dt * 2.2);
    state.camera.x += (targetX - state.camera.x) * smoothing;
    state.camera.y += (targetY - state.camera.y) * smoothing;
  }

  function applyPointerForce(particle, dt) {
    if (!state.pointer.active) return;
    const radius = numeric(CONFIG.interaction.cursorRadius, 115, 20, 420) * (0.72 + particle.depth * 0.55);
    const dx = particle.x - state.pointer.x;
    const dy = particle.y - state.pointer.y;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= radius * radius || distanceSquared < 0.01) return;

    const distance = Math.sqrt(distanceSquared);
    const falloff = 1 - distance / radius;
    const strength = numeric(CONFIG.interaction.repelStrength, 900, 0, 4000);
    const force = falloff * falloff * strength * (0.55 + particle.depth * 0.7) * dt;
    const reducedFactor = state.reduced ? 0.3 : 1;
    const formationFactor = 1 - particle.formMix * 0.55;
    particle.vx += (dx / distance) * force * reducedFactor * formationFactor;
    particle.vy += (dy / distance) * force * reducedFactor * formationFactor;
  }

  function moveAmbient(particle, dt, fall) {
    const drift = numeric(CONFIG.particles.drift, 7, 0, 80) * (state.reduced ? 0.35 : 1);
    const sway = Math.sin(state.time * particle.swaySpeed + particle.phase) * drift * (0.35 + particle.depth);
    particle.x += (particle.vx + sway) * dt;
    particle.y += (particle.vy + fall * (0.38 + particle.depth * 0.95) * particle.fallMultiplier) * dt;

    const damping = Math.exp(-0.65 * dt);
    particle.vx *= damping;
    particle.vy *= damping;

    if (particle.x < -40) {
      particle.x = state.w + 40;
    } else if (particle.x > state.w + 40) {
      particle.x = -40;
    }

    if (particle.y > state.h + 45) {
      particle.y = randomBetween(-90, -15);
      particle.x = randomBetween(-20, state.w + 20);
      particle.vx *= 0.25;
      particle.vy *= 0.25;
    }
  }

  function updateTargetParticle(particle, dt) {
    if (particle.delay > 0) {
      particle.delay -= dt;
      return;
    }

    const dx = particle.tx - particle.x;
    const dy = particle.ty - particle.y;
    const isHeart = particle.target.kind === "heart";
    const spring = (isHeart ? 19 : 16) * particle.spring * (0.82 + particle.depth * 0.28);
    const swirl = (particle.target.swirl || 0) * (isHeart ? 0.7 : 1);

    particle.vx += (dx * spring - dy * swirl) * dt;
    particle.vy += (dy * spring + dx * swirl) * dt;

    const damping = Math.exp(-5.4 * dt);
    particle.vx *= damping;
    particle.vy *= damping;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.formMix = Math.min(1, particle.formMix + dt * (isHeart ? 1.6 : 1.9));
  }

  function updateParticles(dt) {
    const fall = fallSpeed();

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      applyPointerForce(particle, dt);

      if (particle.target) {
        updateTargetParticle(particle, dt);
      } else {
        particle.formMix = Math.max(0, particle.formMix - dt * 1.8);
        moveAmbient(particle, dt, fall);
      }
    }
  }

  function updateWaves(dt) {
    for (let i = waves.length - 1; i >= 0; i -= 1) {
      waves[i].age += dt;
      if (waves[i].age >= waves[i].life) waves.splice(i, 1);
    }
  }

  function addWave(x, y, power = 1) {
    waves.push({
      x,
      y,
      age: 0,
      life: state.reduced ? 0.8 : 1.15,
      maxRadius: (state.reduced ? 95 : 225) * power,
      power
    });
    if (waves.length > 6) waves.shift();
  }

  function burstParticles(x, y, radius, strength) {
    const reducedFactor = state.reduced ? 0.3 : 1;
    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const reach = radius * (0.72 + particle.depth * 0.5);
      const dx = particle.x - x;
      const dy = particle.y - y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared >= reach * reach || distanceSquared < 0.01) continue;
      const distance = Math.sqrt(distanceSquared);
      const force = Math.pow(1 - distance / reach, 2) * strength * (0.55 + particle.depth * 0.72) * reducedFactor;
      particle.vx += (dx / distance) * force;
      particle.vy += (dy / distance) * force;
    }
  }

  function trackPerformance(dt) {
    if (document.hidden || state.reduced) return;
    perf.elapsed += dt;
    perf.frames += 1;
    if (perf.elapsed < 2.8) return;

    const fps = perf.frames / perf.elapsed;
    perf.elapsed = 0;
    perf.frames = 0;

    if (fps < 40) {
      perf.lowStreak += 1;
      perf.highStreak = 0;
    } else if (fps > 57) {
      perf.highStreak += 1;
      perf.lowStreak = 0;
    } else {
      perf.lowStreak = 0;
      perf.highStreak = 0;
    }

    if (perf.lowStreak >= 2 && perfScale > 0.58) {
      perfScale = Math.max(0.58, perfScale * 0.87);
      syncParticleCount(currentBudget());
      perf.lowStreak = 0;
    } else if (perf.highStreak >= 4 && perfScale < 1) {
      perfScale = Math.min(1, perfScale + 0.04);
      syncParticleCount(currentBudget());
      perf.highStreak = 0;
    }
  }

  function update(dt) {
    state.time += dt;
    state.fade = Math.min(1, state.fade + dt / 1.6);
    state.tapBoost *= Math.exp(-dt * 2.1);
    if (state.tapBoost < 0.002) state.tapBoost = 0;

    updateCamera(dt);
    updateSequence(dt);
    updateCodeRain(dt);
    updateParticles(dt);
    updateWaves(dt);
    trackPerformance(dt);
  }

  function render() {
    renderCodeRain();
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.globalCompositeOperation = "lighter";

    const time = state.time;
    const fade = state.fade;
    const camera = state.camera;

    for (let i = 0; i < particles.length; i += 1) {
      const particle = particles[i];
      const target = particle.target;
      const mix = particle.formMix;
      const heartMode = Boolean(target && target.kind === "heart" && mix > 0.04);
      const spriteSet = heartMode ? heartSprites : ambientSprites;
      const colorIndex = heartMode ? particle.heartColorIndex : particle.colorIndex;
      const useStar = particle.flare || (heartMode && particle.star && target.edge);
      const sprite = useStar ? spriteSet.star[colorIndex] : spriteSet.glow[colorIndex];

      const parallax = (1 - mix * 0.94);
      const drawX = particle.x + camera.x * (particle.depth - 0.5) * 1.35 * parallax;
      const drawY = particle.y + camera.y * (particle.depth - 0.5) * 1.35 * parallax;

      if (drawX < -50 || drawX > state.w + 50 || drawY < -50 || drawY > state.h + 50) continue;

      const twinkle = state.reduced
        ? 0.92
        : particle.twinkleFloor +
          (1 - particle.twinkleFloor) *
            (0.5 + 0.5 * Math.sin(time * particle.twinkleSpeed + particle.phase));

      let alpha = particle.alpha * twinkle;
      if (target && mix > 0) {
        const targetAlpha = target.kind === "heart" ? (target.edge ? 0.98 : 0.48) : 0.9;
        alpha = alpha * (1 - mix) + targetAlpha * mix;
      }

      if (heartMode) {
        alpha *= 1 + state.heartBeat * 0.26 + state.tapBoost * 0.55;
      }

      alpha *= fade;
      if (alpha < 0.008) continue;

      let diameter = particle.size * (4.3 + mix * 1.7);
      if (particle.flare) diameter *= 1.5;
      if (heartMode && target.edge) diameter *= 1.15;

      const half = diameter / 2;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(sprite, drawX - half, drawY - half, diameter, diameter);

      if (particle.flare) {
        const halo = diameter * 2.6;
        ctx.globalAlpha = Math.min(0.18, alpha * 0.2);
        ctx.drawImage(sprite, drawX - halo / 2, drawY - halo / 2, halo, halo);
      }
    }

    for (let i = 0; i < waves.length; i += 1) {
      const wave = waves[i];
      const progress = wave.age / wave.life;
      const eased = 1 - Math.pow(1 - progress, 3);
      const radius = wave.maxRadius * eased;
      const alpha = Math.pow(1 - progress, 2) * 0.3 * wave.power;
      if (radius < 1 || alpha < 0.004) continue;

      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius, 0, TAU);
      ctx.strokeStyle = `rgba(255, 128, 192, ${alpha})`;
      ctx.lineWidth = 1.15;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255, 190, 225, ${alpha * 0.2})`;
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function eventPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function isInterfaceEvent(event) {
    return event.target instanceof Element && Boolean(event.target.closest("button, a, .controls"));
  }

  function isPointInHeart(x, y) {
    return Boolean(state.heartCanTap && state.heartPoly && pointInPolygon(x, y, state.heartPoly));
  }

  function triggerHeartTap() {
    state.tapBoost = 1;
    dedication.classList.remove("is-touched");
    void dedication.offsetWidth;
    dedication.classList.add("is-touched");
    if (tapAnimationTimer) clearTimeout(tapAnimationTimer);
    tapAnimationTimer = window.setTimeout(() => {
      dedication.classList.remove("is-touched");
      tapAnimationTimer = 0;
    }, 760);
  }

  function handlePointerMove(event) {
    if (isInterfaceEvent(event)) return;
    const point = eventPoint(event);
    const pointer = state.pointer;
    const moved = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.lastX = point.x;
    pointer.lastY = point.y;
    pointer.active = true;
    if (moved > 3) dismissHint();
  }

  function handlePointerDown(event) {
    if (isInterfaceEvent(event)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const point = eventPoint(event);
    const pointer = state.pointer;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.lastX = point.x;
    pointer.lastY = point.y;
    pointer.active = true;
    pointer.down = true;
    dismissHint();

    const onHeart = isPointInHeart(point.x, point.y);
    addWave(point.x, point.y, onHeart ? 0.9 : 1);

    const radius = numeric(CONFIG.interaction.tapRadius, 210, 30, 700);
    const strength = numeric(CONFIG.interaction.tapStrength, 430, 0, 1800) * (onHeart ? 0.28 : 1);
    burstParticles(point.x, point.y, radius, strength);

    if (onHeart) triggerHeartTap();
  }

  function handlePointerUp(event) {
    const pointer = state.pointer;
    pointer.down = false;
    if (event.pointerType !== "mouse") pointer.active = false;
  }

  function updateHintLabel() {
    hintLabel.textContent = coarsePointerQuery.matches ? "коснись света" : "двигай курсором · коснись света";
  }

  function updateFullscreenUI() {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    body.classList.toggle("is-fullscreen", active);
    if (!fullscreenButton) return;
    fullscreenButton.setAttribute(
      "aria-label",
      active ? "Выйти из полноэкранного режима" : "Открыть на весь экран"
    );
    fullscreenButton.title = active ? "Выйти из полноэкранного режима (F)" : "На весь экран (F)";
  }

  async function toggleFullscreen() {
    const element = document.documentElement;
    const requestFullscreen = element.requestFullscreen || element.webkitRequestFullscreen;
    const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
    const active = document.fullscreenElement || document.webkitFullscreenElement;

    try {
      if (!active && requestFullscreen) {
        await requestFullscreen.call(element);
      } else if (active && exitFullscreen) {
        await exitFullscreen.call(document);
      }
    } catch (error) {
      updateFullscreenUI();
    }
  }

  function setupFullscreen() {
    if (!fullscreenButton) return;
    const element = document.documentElement;
    const supported = Boolean(element.requestFullscreen || element.webkitRequestFullscreen);
    if (!supported) {
      fullscreenButton.hidden = true;
      return;
    }
    fullscreenButton.addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", updateFullscreenUI);
    document.addEventListener("webkitfullscreenchange", updateFullscreenUI);
    updateFullscreenUI();
  }

  function applyMotionPreference() {
    state.reduced = reduceMotionQuery.matches;
    body.classList.toggle("reduce-motion", state.reduced);
    if (state.reduced) {
      state.camera.x = 0;
      state.camera.y = 0;
    }
    syncParticleCount(currentBudget());
  }

  function handleKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = event.target && event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    if (event.code === "KeyR") {
      event.preventDefault();
      restartExperience(true);
    } else if (event.code === "KeyF") {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  let lastFrameTime = performance.now();
  let firstFrame = true;

  function frame(now) {
    const delta = Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.05);
    lastFrameTime = now;

    update(delta);
    render();

    if (firstFrame) {
      firstFrame = false;
      requestAnimationFrame(() => body.classList.add("is-ready"));
    }

    requestAnimationFrame(frame);
  }

  function initEvents() {
    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", () => window.setTimeout(scheduleResize, 220), { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleResize, { passive: true });
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    window.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) {
        state.pointer.active = false;
        state.pointer.down = false;
      }
    });
    window.addEventListener("blur", () => {
      state.pointer.active = false;
      state.pointer.down = false;
    });

    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) lastFrameTime = performance.now();
    });

    if (replayButton) {
      replayButton.addEventListener("click", () => restartExperience(true));
    }

    if (typeof reduceMotionQuery.addEventListener === "function") {
      reduceMotionQuery.addEventListener("change", applyMotionPreference);
    } else if (typeof reduceMotionQuery.addListener === "function") {
      reduceMotionQuery.addListener(applyMotionPreference);
    }

    if (typeof coarsePointerQuery.addEventListener === "function") {
      coarsePointerQuery.addEventListener("change", updateHintLabel);
    } else if (typeof coarsePointerQuery.addListener === "function") {
      coarsePointerQuery.addListener(updateHintLabel);
    }

    setupFullscreen();
  }

  function init() {
    resizeCanvas();
    syncParticleCount(currentBudget());
    layoutDedication();
    body.classList.toggle("reduce-motion", state.reduced);
    startTimeline();
    initEvents();
    lastFrameTime = performance.now();
    requestAnimationFrame(frame);
  }

  init();
})();

