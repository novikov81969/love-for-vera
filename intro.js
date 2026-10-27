(function () {
  "use strict";

  var canvas = document.getElementById("stage");
  var ctx = canvas.getContext("2d");
  var hud = document.querySelector(".hud");
  var titleEl = document.getElementById("title");
  var meter = document.getElementById("meter");
  var meterFill = document.getElementById("meter-fill");
  var burstFx = document.getElementById("burst");
  var fade = document.getElementById("fade");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DECAY = 0.12;
  var GAIN = 0.038;
  var FAST_GAIN = 0.022;
  var TAP_COLORS = ["#fb7185", "#fda4af", "#fecdd3", "#fef08a", "#fff1f2"];
  var CONFETTI_COLORS = ["#e11d48", "#f472b6", "#fb7185", "#fda4af", "#fef08a", "#86efac", "#67e8f9", "#a78bfa"];
  var PHRASES = ["Нажимай...", "Продолжай...", "Почти полный!", "Уже почти!"];

  var W = 0;
  var H = 0;

  var mode = "charge";
  var charge = 0;
  var speedHint = "press";
  var lastTapAt = 0;
  var lastTapTs = 0;
  var tapCount = 0;
  var burstAt = 0;
  var burstSpawned = false;
  var navigated = false;

  var ripples = [];
  var sparks = [];
  var confetti = [];
  var petals = [];

  var lastFrame = performance.now();
  var rafId = 0;

  var lastTitle = "";
  var lastPercent = -1;
  var lastHot = false;

  var audio = null;

  function audioContext() {
    if (!audio) {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      try {
        audio = new Ctor();
      } catch (error) {
        return null;
      }
    }
    if (audio.state === "suspended") {
      audio.resume().catch(function () {});
    }
    return audio;
  }

  function playTap(level) {
    try {
      var ac = audioContext();
      if (!ac) return;
      var now = ac.currentTime;
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = 520 * (0.85 + 0.55 * level) + 40 * Math.random();
      osc.connect(gain);
      gain.connect(ac.destination);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (error) {}
  }

  function noiseBuffer(ac, duration, power) {
    var length = Math.max(1, Math.floor(ac.sampleRate * duration));
    var buffer = ac.createBuffer(1, length, ac.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i += 1) {
      data[i] = (2 * Math.random() - 1) * Math.pow(1 - i / length, power);
    }
    return buffer;
  }

  function playBurstSound() {
    try {
      var ac = audioContext();
      if (!ac) return;
      var t0 = ac.currentTime + 0.01;

      [
        [0, 62, 0.3],
        [0.3, 54, 0.36]
      ].forEach(function (item) {
        var start = t0 + item[0];
        var osc = ac.createOscillator();
        var gain = ac.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(item[1], start);
        osc.frequency.exponentialRampToValueAtTime(34, start + 0.2);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(item[2], start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(start);
        osc.stop(start + 0.34);
      });

      var whoosh = ac.createOscillator();
      var whooshFilter = ac.createBiquadFilter();
      var whooshGain = ac.createGain();
      whoosh.type = "sawtooth";
      whoosh.frequency.setValueAtTime(120, t0 + 0.06);
      whoosh.frequency.exponentialRampToValueAtTime(880, t0 + 0.52);
      whooshFilter.type = "lowpass";
      whooshFilter.frequency.setValueAtTime(520, t0 + 0.06);
      whooshFilter.frequency.exponentialRampToValueAtTime(4200, t0 + 0.52);
      whooshGain.gain.setValueAtTime(0.0001, t0 + 0.06);
      whooshGain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.5);
      whooshGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.57);
      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(ac.destination);
      whoosh.start(t0 + 0.06);
      whoosh.stop(t0 + 0.57);

      var boom = ac.createOscillator();
      var boomGain = ac.createGain();
      boom.type = "sine";
      boom.frequency.setValueAtTime(150, t0 + 0.52);
      boom.frequency.exponentialRampToValueAtTime(34, t0 + 0.8);
      boomGain.gain.setValueAtTime(0.0001, t0 + 0.52);
      boomGain.gain.linearRampToValueAtTime(0.4, t0 + 0.528);
      boomGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.02);
      boom.connect(boomGain);
      boomGain.connect(ac.destination);
      boom.start(t0 + 0.52);
      boom.stop(t0 + 1.04);

      var pop = ac.createBufferSource();
      pop.buffer = noiseBuffer(ac, 0.09, 7);
      var popFilter = ac.createBiquadFilter();
      popFilter.type = "bandpass";
      popFilter.frequency.value = 2100;
      popFilter.Q.value = 1.2;
      var popGain = ac.createGain();
      popGain.gain.setValueAtTime(0.2, t0 + 0.52);
      popGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.64);
      pop.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(ac.destination);
      pop.start(t0 + 0.52);

      var wind = ac.createBufferSource();
      wind.buffer = noiseBuffer(ac, 0.7, 2.2);
      var windFilter = ac.createBiquadFilter();
      windFilter.type = "highpass";
      windFilter.frequency.value = 3800;
      var windGain = ac.createGain();
      windGain.gain.setValueAtTime(0.0001, t0 + 0.56);
      windGain.gain.linearRampToValueAtTime(0.05, t0 + 0.64);
      windGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.27);
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(ac.destination);
      wind.start(t0 + 0.56);

      [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        var start = t0 + 0.52 + 0.09 * i;
        var tone = ac.createOscillator();
        var toneGain = ac.createGain();
        tone.type = "triangle";
        tone.frequency.value = freq;
        tone.connect(toneGain);
        toneGain.connect(ac.destination);
        toneGain.gain.setValueAtTime(0, start);
        toneGain.gain.linearRampToValueAtTime(0.11, start + 0.03);
        toneGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
        tone.start(start);
        tone.stop(start + 0.6);
      });
    } catch (error) {}
  }

  function resize() {
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * ratio);
    canvas.height = Math.floor(H * ratio);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function heartSize() {
    var compact = H < 560 && W > H;
    return (compact ? 0.32 : 0.35) * Math.min(W, H);
  }

  function heartX() {
    return W / 2;
  }

  function heartY() {
    var compact = H < 560 && W > H;
    return (compact ? 0.3 : 0.36) * H;
  }

  function heartPath(g, x, y, size) {
    var n = 0.3 * size;
    g.beginPath();
    g.moveTo(x, y + n);
    g.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + n);
    g.bezierCurveTo(x - size / 2, y + (size + n) / 2, x, y + (size + n) / 2, x, y + size);
    g.bezierCurveTo(x, y + (size + n) / 2, x + size / 2, y + (size + n) / 2, x + size / 2, y + n);
    g.bezierCurveTo(x + size / 2, y, x, y, x, y + n);
    g.closePath();
  }

  function liquidY(x, top, size, time, level) {
    var amp = Math.min(18, 0.12 * size) * (0.5 + 0.5 * level);
    var phase = 0.0032 * time;
    return (
      top +
      Math.sin(0.02 * x + 2.4 * phase) * amp * 0.38 +
      Math.sin(0.046 * x - 3.1 * phase) * amp * 0.26 +
      Math.sin(0.011 * x + 1.35 * phase) * amp * 0.2 +
      Math.sin(0.072 * x + 3.9 * phase) * amp * 0.16 +
      Math.sin(0.004 * x + 0.85 * phase + 1.4 * Math.sin(0.42 * phase)) * amp * 0.22
    );
  }

  function liquidGradient(g, x, top, bottom, level) {
    var grad = g.createLinearGradient(x, top, x, bottom - 6);

    if (level < 0.25) {
      grad.addColorStop(0, "#3b0764");
      grad.addColorStop(0.4, "#6b21a8");
      grad.addColorStop(0.75, "#a21caf");
      grad.addColorStop(1, "rgba(216, 180, 254, 0.94)");
    } else if (level < 0.5) {
      grad.addColorStop(0, "#701a75");
      grad.addColorStop(0.35, "#a21caf");
      grad.addColorStop(0.7, "#db2777");
      grad.addColorStop(1, "rgba(244, 114, 182, 0.94)");
    } else if (level < 0.75) {
      grad.addColorStop(0, "#831843");
      grad.addColorStop(0.3, "#9f1239");
      grad.addColorStop(0.65, "#be123c");
      grad.addColorStop(1, "rgba(251, 113, 133, 0.95)");
    } else {
      grad.addColorStop(0, "#7f1d1d");
      grad.addColorStop(0.28, "#9f1239");
      grad.addColorStop(0.52, "#be123c");
      grad.addColorStop(0.78, "#e11d48");
      grad.addColorStop(1, "rgba(251, 113, 133, 0.98)");
    }

    return grad;
  }

  function drawLiquid(g, x, y, size, level, time) {
    var amount = 1.15 * size * level;
    var left = x - 0.65 * size;
    var right = x + 0.65 * size;
    var bottom = y + 0.95 * size + 8;
    var top = y + 0.95 * size - amount;

    g.beginPath();
    g.moveTo(left, bottom);
    g.lineTo(right, bottom);
    for (var i = 0; i <= 88; i += 1) {
      var px = right - (i / 88) * (right - left);
      g.lineTo(px, liquidY(px, top, size, time, level));
    }
    g.closePath();
    g.fillStyle = liquidGradient(g, x, top, bottom, level);
    g.fill();

    g.save();
    g.globalCompositeOperation = "overlay";
    var sheen = g.createLinearGradient(x - 0.4 * size, top, x + 0.35 * size, bottom);
    sheen.addColorStop(0, "rgba(255, 255, 255, 0.16)");
    sheen.addColorStop(0.45, "rgba(255, 255, 255, 0)");
    sheen.addColorStop(1, "rgba(190, 18, 60, 0.18)");
    g.fillStyle = sheen;
    g.fill();
    g.restore();

    g.beginPath();
    for (var j = 0; j <= 88; j += 1) {
      var sx = left + (j / 88) * (right - left);
      var sy = liquidY(sx, top, size, time, level);
      if (j === 0) g.moveTo(sx, sy);
      else g.lineTo(sx, sy);
    }
    g.strokeStyle = "rgba(254, 205, 211, 0.72)";
    g.lineWidth = 2;
    g.stroke();

    g.globalAlpha = 0.45;
    g.beginPath();
    var wave = 0.0021 * time;
    for (var k = 0; k <= 88; k += 1) {
      var wx = left + (k / 88) * (right - left);
      var wy = liquidY(wx, top, size, time, level) + 2.2 * Math.sin(0.055 * wx + 2.6 * wave);
      if (k === 0) g.moveTo(wx, wy);
      else g.lineTo(wx, wy);
    }
    g.strokeStyle = "rgba(255, 255, 255, 0.55)";
    g.lineWidth = 1;
    g.stroke();
    g.globalAlpha = 1;

    var bubblePhase = 0.0022 * time;
    for (var b = 0; b < 3; b += 1) {
      var bx = x + Math.sin(bubblePhase + 2.1 * b) * size * 0.2;
      var by = top + 0.32 * amount + Math.cos(1.45 * bubblePhase + b) * size * 0.1;
      var rx = Math.max(0, 0.2 * size);
      var ry = Math.max(0, 0.09 * size);
      if (rx === 0 || ry === 0) continue;
      g.beginPath();
      g.ellipse(bx, by, rx, ry, bubblePhase + b, 0, Math.PI * 2);
      g.fillStyle = "rgba(255, 228, 232, " + (0.06 + 0.03 * b) + ")";
      g.fill();
    }
  }

  function drawHeart(x, y, size, level, time, scaleX, scaleY, offsetX, offsetY, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + offsetX, y + offsetY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-x, -y);

    if (!reduceMotion) {
      ctx.save();
      ctx.globalAlpha = (0.18 + 0.42 * level) * alpha;
      ctx.fillStyle = "rgba(244, 63, 94, 0.55)";
      heartPath(ctx, x, y, size * (1.1 + 0.16 * level));
      ctx.fill();
      ctx.fillStyle = "rgba(253, 164, 175, 0.28)";
      heartPath(ctx, x, y, size * (1.22 + 0.2 * level));
      ctx.fill();
      ctx.restore();
    }

    heartPath(ctx, x, y, size);
    ctx.save();
    ctx.clip();
    drawLiquid(ctx, x, y, size, level, time);
    ctx.restore();

    heartPath(ctx, x, y, size);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();

    heartPath(ctx, x, y, size);
    ctx.strokeStyle = "#fda4af";
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = (0.5 + 0.5 * level) * alpha;
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function bump(time, center, width) {
    var distance = Math.abs(time - center);
    return distance >= width ? 0 : 1 - distance / width;
  }

  function beatScale(ms, k) {
    if (ms < 0 || ms > 260) return { x: 1, y: 1 };
    var strength = 0.72 + 0.28 * k;

    if (ms < 50) {
      var a = ms / 50;
      return { x: 1 + 0.18 * a * strength, y: 1 - 0.2 * a * strength };
    }
    if (ms < 140) {
      var b = (ms - 50) / 90;
      return { x: 1.18 * strength - 0.26 * b * strength, y: 0.8 + 0.34 * b * strength };
    }
    var c = (ms - 140) / 120;
    return { x: 0.92 + 0.08 * c, y: 1.14 - 0.14 * c };
  }

  function syncUi() {
    var percent = Math.round(charge * 100);
    if (percent !== lastPercent) {
      lastPercent = percent;
      meterFill.style.width = percent + "%";
      meter.setAttribute("aria-valuenow", String(percent));
    }

    var hot = charge > 0.75;
    if (hot !== lastHot) {
      lastHot = hot;
      meter.classList.toggle("is-hot", hot);
    }

    var text;
    if (charge > 0.02) {
      text = PHRASES[Math.min(3, Math.floor(4 * charge))];
    } else {
      text = speedHint === "faster" ? "Быстрее!" : "Нажми здесь";
    }

    if (text !== lastTitle) {
      lastTitle = text;
      titleEl.textContent = text;
    }
  }

  function spawnSparks(level) {
    var x = heartX();
    var y = heartY();
    var size = heartSize();
    var count = W < 640 ? 6 : 9;

    for (var i = 0; i < count; i += 1) {
      var angle = (i / count) * Math.PI * 2 + 0.4 * Math.random();
      var speed = 2.2 + 3.4 * Math.random() + 2 * level;
      sparks.push({
        x: x + Math.cos(angle) * size * 0.12,
        y: y + Math.sin(angle) * size * 0.12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        life: 1,
        s: 4 + 7 * Math.random(),
        color: TAP_COLORS[Math.floor(Math.random() * TAP_COLORS.length)]
      });
    }

    if (sparks.length > 28) sparks.splice(0, sparks.length - 28);
  }

  function spawnBurst() {
    burstSpawned = true;

    var x = heartX();
    var y = heartY();
    var total = reduceMotion ? 180 : W < 640 ? 700 : 1100;

    confetti.length = 0;
    for (var i = 0; i < total; i += 1) {
      confetti.push({
        x: x + (Math.random() - 0.5) * 220,
        y: y + (Math.random() - 0.5) * 90,
        vx: (Math.random() - 0.5) * 24,
        vy: -18 * Math.random() - 6,
        w: 5 + 8 * Math.random(),
        h: 3 + 6 * Math.random(),
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.42,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 1
      });
    }

    petals.length = 0;
    if (!reduceMotion) {
      var count = W < 640 ? 14 : 20;
      for (var p = 0; p < count; p += 1) {
        var angle = (p / count) * Math.PI * 2 + 0.28 * Math.random();
        var speed = 5 + 10 * Math.random();
        petals.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.4,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.28,
          s: 7 + 20 * Math.random(),
          life: 1,
          color: p % 2 === 0 ? "#e11d48" : "#fb7185"
        });
      }
    }
  }

  function tap() {
    if (mode !== "charge") return;

    var now = performance.now();
    var previous = lastTapAt;
    var gap = now - previous;
    lastTapAt = now;

    if (previous > 0 && gap > 280) {
      speedHint = "faster";
    } else if (previous > 0 && gap < 200) {
      speedHint = "press";
    }

    var bonus = gap < 180 && previous > 0 ? FAST_GAIN : 0;
    charge = Math.min(1, charge + GAIN + bonus);

    var tapsBefore = tapCount;
    tapCount += 1;
    lastTapTs = now;

    if (!reduceMotion) {
      ripples.push({ t: now });
      if (ripples.length > 4) ripples.shift();
      spawnSparks(charge);
    }

    if (navigator.vibrate) {
      navigator.vibrate(6 + Math.round(10 * charge) + Math.min(tapsBefore, 12));
    }

    playTap(charge);
    syncUi();

    if (charge >= 1) {
      charge = 1;
      syncUi();
      burstAt = now;
      burstSpawned = false;
      mode = "burst";
      hud.classList.add("is-hidden");
      canvas.style.cursor = "default";
      burstFx.classList.add("is-on");
      if (navigator.vibrate) navigator.vibrate([50, 40, 60, 40, 120]);
      playBurstSound();
    }
  }

  function drawFrame() {
    rafId = window.requestAnimationFrame(drawFrame);

    var now = performance.now();
    var dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    if (mode === "charge") {
      charge = Math.max(0, charge - DECAY * dt);
      syncUi();
    }

    ctx.fillStyle = "#0f0a0f";
    ctx.fillRect(0, 0, W, H);

    var x = heartX();
    var y = heartY();
    var size = heartSize();
    var level = charge;
    var elapsed = now - lastTapTs;
    var strength = Math.min(1, tapCount / 18);

    var scaleX = 1;
    var scaleY = 1;
    var offsetX = 0;
    var offsetY = 0;
    var alpha = 1;

    if (mode === "charge") {
      var beat = reduceMotion
        ? { x: 1 + (elapsed < 120 ? 0.04 : 0), y: 1 }
        : beatScale(elapsed, strength);
      var wobble = 1 + Math.sin(0.0058 * now) * (0.018 + 0.028 * level);

      scaleX = beat.x * wobble;
      scaleY = beat.y * wobble;

      if (!reduceMotion) {
        var amp = (3 + 12 * level + 0.22 * Math.min(tapCount, 28)) * Math.exp(-Math.max(0, elapsed) / 170);
        offsetX = Math.sin(0.09 * now) * amp;
        offsetY = Math.cos(0.12 * now) * amp * 0.55;
      }
    } else {
      var burstElapsed = now - burstAt;

      if (burstElapsed < 520) {
        var r1 = bump(burstElapsed, 40, 160);
        var r2 = bump(burstElapsed, 300, 170);
        var growth = Math.min(1, burstElapsed / 520);
        scaleX = scaleY = 1 + 0.2 * r1 + 0.34 * r2 + 0.08 * growth;

        if (burstElapsed > 430) {
          var squash = (burstElapsed - 430) / 90;
          scaleX *= 1 - 0.22 * squash;
          scaleY *= 1 + 0.12 * squash;
        }

        if (!reduceMotion && burstElapsed < 420) {
          var burstAmp = (2 + 14 * growth) * (1 - burstElapsed / 420);
          offsetX = Math.sin(0.14 * now) * burstAmp;
          offsetY = Math.cos(0.17 * now) * burstAmp * 0.5;
        }
      } else {
        alpha = Math.max(0, 1 - (burstElapsed - 520) / 140);
        scaleX = scaleY = 1.55 + (burstElapsed - 520) * 0.004;
      }

      if (burstElapsed >= 520 && !burstSpawned) spawnBurst();
    }

    if (alpha > 0.02) {
      drawHeart(x, y, size, level, now, scaleX, scaleY, offsetX, offsetY, alpha);
    }

    if (!reduceMotion && mode === "charge") {
      for (var r = ripples.length - 1; r >= 0; r -= 1) {
        var progress = Math.max(0, now - ripples[r].t) / 520;
        if (progress >= 1) {
          ripples.splice(r, 1);
          continue;
        }
        var radius = Math.max(0, 0.28 * size + progress * size * 1.55);
        if (radius <= 0) continue;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(254, 205, 211, " + 0.55 * (1 - progress) + ")";
        ctx.lineWidth = 3.2 * (1 - progress) + 0.4;
        ctx.stroke();
        ctx.restore();
      }

      for (var s = sparks.length - 1; s >= 0; s -= 1) {
        var spark = sparks[s];
        spark.life -= 2.4 * dt;
        spark.x += spark.vx * dt * 60;
        spark.y += spark.vy * dt * 60;
        spark.vy += 0.18 * dt * 60;

        if (spark.life <= 0) {
          sparks.splice(s, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, spark.life);
        ctx.translate(spark.x, spark.y);
        heartPath(ctx, 0, 0, spark.s);
        ctx.fillStyle = spark.color;
        ctx.fill();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    }

    if (mode === "burst") {
      for (var p = petals.length - 1; p >= 0; p -= 1) {
        var petal = petals[p];
        petal.life -= 1.2195 * dt;
        petal.x += petal.vx * dt * 60;
        petal.y += petal.vy * dt * 60;
        petal.vy += 0.42 * dt * 60;
        petal.rot += petal.vr;

        if (petal.life <= 0) {
          petals.splice(p, 1);
          continue;
        }

        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate(petal.rot);
        ctx.globalAlpha = Math.max(0, petal.life);
        heartPath(ctx, 0, 0, petal.s);
        ctx.fillStyle = petal.color;
        ctx.fill();
        ctx.restore();
      }

      for (var c = confetti.length - 1; c >= 0; c -= 1) {
        var piece = confetti[c];
        piece.life -= 0.45 * dt;
        piece.x += piece.vx * dt * 60;
        piece.y += piece.vy * dt * 60;
        piece.vy += 0.35 * dt * 60;
        piece.rot += piece.vr;

        if (piece.life <= 0) continue;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rot);
        ctx.fillStyle = piece.color;
        ctx.globalAlpha = Math.max(0, piece.life);
        ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
        ctx.restore();
      }

      ctx.globalAlpha = 1;

      if (!navigated && now - burstAt >= 1500) {
        navigated = true;
        fade.classList.add("is-on");
        window.setTimeout(function () {
          window.location.href = "letter.html?v=4";
        }, 520);
      }
    }
  }

  canvas.addEventListener("pointerdown", function (event) {
    event.preventDefault();
    tap();
  });

  canvas.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  window.addEventListener("keydown", function (event) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      tap();
    }
  });

  window.addEventListener("resize", resize);

  resize();
  syncUi();
  rafId = window.requestAnimationFrame(drawFrame);

  window.addEventListener("pagehide", function () {
    window.cancelAnimationFrame(rafId);
    if (audio) {
      try {
        audio.close();
      } catch (error) {}
    }
  });
})();
