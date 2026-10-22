/*
  ВСЕ НАСТРОЙКИ САЙТА — В ЭТОМ ФАЙЛЕ.
  Меняйте значения, сохраняйте файл и обновляйте страницу.
*/
window.LOVE_CONFIG = {
  name: "любимая!",
  finalTitle: "С Днём Рождения,",

  // Количество частиц и скорость звёздного дождя.
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

  // Палитра частиц. weight — относительная частота цвета.
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

  // Форма и размер финального сердца.
  heart: {
    size: 1,
    widthFactor: 0.72,
    portraitWidthFactor: 0.9,
    heightRatio: 0.88,
    edgeRatio: 0.46,
    flowParticles: 0.1,
    beatDuration: 1.28
  },

  // Текст, собранный из частиц.
  text: {
    fontFamily: '"Arial Black", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    maxWidth: 0.64,
    maxHeight: 0.36,
    centerY: 0.47
  },

  // Падающие надписи и код на старте.
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

  /*
    Тайминги сцен в секундах.
    Момент появления сердца = intro + все form/hold/dissolve у слов + heart.form.
    Чтобы сердце появилось раньше, уменьшите intro или значения ниже.
  */
  sequence: {
    intro: 4.2,
    words: [
      { text: "3",    form: 1.0, hold: 1.25, dissolve: 0.65, countdown: true },
      { text: "2",    form: 1.0, hold: 1.25, dissolve: 0.65, countdown: true },
      { text: "1",    form: 1.0, hold: 1.25, dissolve: 0.65, countdown: true },
      { text: "You",  form: 2.3, hold: 1.4, dissolve: 1.0 },
      { text: "Are",  form: 2.0, hold: 1.1, dissolve: 1.0 },
      { text: "My",   form: 1.9, hold: 1.0, dissolve: 1.0 },
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
