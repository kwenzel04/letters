const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("");
const LOWER = "abcdefghijklmnopqrstuvwxyzäöüß".split("");
const COLOR_COUNT = 6; // Farben stehen im CSS (--l0 bis --l5)
const THRESHOLD = 90; // Pixel, ab denen ein Wisch zählt

const ALL_VOWELS = ["a", "e", "i", "o", "u", "ä", "ö", "ü", "ei", "eu"];
const ALL_CONSONANTS = ["b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "r", "s", "t", "w"];
const SYLLABLE_WORD_COUNT = 20; // Wie viele Wörter pro Runde

const $ = (id) => document.getElementById(id);
const card = $("card");
const letterEl = $("letter");
const ghost = $("ghost");
const doneEl = $("done");
const deck = $("deck");
const answersEl = $("answers");
const barEl = $("bar");
const progressEl = $("progress");
const countEl = $("count");
const statEl = $("stat");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let mainMode = "letters"; // "letters" oder "syllables"
let mode = "both";
let queue = [];
let total = 0;
let misses = new Set();
let busy = false;

// Silben-Einstellungen
let syllableCount = 2;
let activeVowels = new Set(ALL_VOWELS);
let activeConsonants = new Set(ALL_CONSONANTS);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck() {
  if (mode === "upper") return [...UPPER];
  if (mode === "lower") return [...LOWER];
  return [...UPPER, ...LOWER];
}

/* ---- Silben-Generator ---- */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWord(numSyllables, vowels, consonants) {
  // Strikt alternierend: V-K-V-K... oder K-V-K-V...
  // Jede Silbe = ein Paar (2 Laute)
  const totalPairs = numSyllables;
  const startWithVowel = Math.random() < 0.5;
  let word = "";
  for (let i = 0; i < totalPairs; i++) {
    if (startWithVowel) {
      word += pickRandom(vowels) + pickRandom(consonants);
    } else {
      word += pickRandom(consonants) + pickRandom(vowels);
    }
  }
  // Zufällig groß oder klein am Anfang
  if (Math.random() < 0.5) {
    word = word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

function buildSyllableDeck() {
  const vowels = [...activeVowels];
  const consonants = [...activeConsonants];

  if (vowels.length === 0 || consonants.length === 0) {
    return ["---"]; // Fallback
  }

  const words = new Set();
  let attempts = 0;
  while (words.size < SYLLABLE_WORD_COUNT && attempts < 200) {
    words.add(generateWord(syllableCount, vowels, consonants));
    attempts++;
  }
  return [...words];
}

/* ---- UI: Silben-Einstellungen ---- */
function initSyllableSettings() {
  const vowelContainer = $("vowel-toggles");
  const consonantContainer = $("consonant-toggles");

  ALL_VOWELS.forEach(v => {
    const btn = document.createElement("button");
    btn.className = "letter-toggle";
    if (v.length > 1) btn.classList.add("letter-toggle-wide");
    btn.textContent = v.toUpperCase();
    btn.dataset.letter = v;
    btn.setAttribute("aria-pressed", "true");
    btn.addEventListener("click", () => {
      const active = btn.getAttribute("aria-pressed") === "true";
      // Mindestens 1 Vokal muss aktiv bleiben
      if (active && activeVowels.size <= 1) return;
      btn.setAttribute("aria-pressed", String(!active));
      if (active) activeVowels.delete(v);
      else activeVowels.add(v);
      start();
    });
    vowelContainer.appendChild(btn);
  });

  ALL_CONSONANTS.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "letter-toggle";
    btn.textContent = c.toUpperCase();
    btn.dataset.letter = c;
    btn.setAttribute("aria-pressed", "true");
    btn.addEventListener("click", () => {
      const active = btn.getAttribute("aria-pressed") === "true";
      // Mindestens 1 Konsonant muss aktiv bleiben
      if (active && activeConsonants.size <= 1) return;
      btn.setAttribute("aria-pressed", String(!active));
      if (active) activeConsonants.delete(c);
      else activeConsonants.add(c);
      start();
    });
    consonantContainer.appendChild(btn);
  });

  document.querySelectorAll(".syl-count").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".syl-count").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      syllableCount = parseInt(btn.dataset.count, 10);
      start();
    });
  });
}

/* ---- Start ---- */
function start() {
  if (mainMode === "syllables") {
    queue = shuffle(buildSyllableDeck());
  } else {
    queue = shuffle(buildDeck());
  }
  total = queue.length;
  misses = new Set();
  render();
}

function render() {
  const finished = queue.length === 0;
  deck.hidden = finished;
  doneEl.hidden = !finished;
  answersEl.hidden = finished;

  const done = total - queue.length;
  barEl.style.width = (total ? (done / total) * 100 : 0) + "%";
  progressEl.setAttribute("aria-valuenow", Math.round((done / total) * 100) || 0);
  countEl.textContent = finished ? "" : `noch ${queue.length}`;

  if (finished) {
    statEl.textContent = `${total - misses.size} von ${total} gleich gewusst`;
    return;
  }
  const letter = queue[0];
  letterEl.textContent = letter;

  // Schriftgröße dynamisch anpassen für Silben-Wörter
  if (mainMode === "syllables") {
    card.classList.add("syllable-card");
    const len = letter.length;
    // Basiert auf tatsächlicher Kartenbreite statt Viewport
    const cardWidth = card.clientWidth || 300;
    const px = Math.min(cardWidth * 0.8, Math.max(32, (cardWidth * 1.3) / len));
    letterEl.style.fontSize = px + "px";
  } else {
    card.classList.remove("syllable-card");
    letterEl.style.fontSize = "";
  }

  // gleiche Farbe für Groß- und Kleinbuchstabe
  card.dataset.c = letter.toLowerCase().charCodeAt(0) % COLOR_COUNT;
  ghost.hidden = queue.length < 2;
}

function setDrag(x) {
  if (x === 0) {
    card.style.transform = "";
    card.style.setProperty("--p", 0);
    return;
  }
  card.style.transform = `translateX(${x}px) rotate(${x / 18}deg)`;
  card.style.setProperty("--p", Math.max(-1, Math.min(1, x / THRESHOLD)));
}

function resetInstantly() {
  card.classList.add("dragging"); // schaltet Transition aus
  setDrag(0);
  void card.offsetWidth;
  card.classList.remove("dragging");
}

function answer(known) {
  if (busy || queue.length === 0) return;
  busy = true;
  if (navigator.vibrate) navigator.vibrate(known ? 8 : [8, 40, 8]);

  card.style.setProperty("--p", known ? 1 : -1);
  card.style.transform = `translateX(${known ? 130 : -130}vw) rotate(${known ? 18 : -18}deg)`;

  setTimeout(() => {
    const current = queue.shift();
    if (!known) {
      misses.add(current);
      queue.push(current); // ans Ende, wird wiederholt
    }
    resetInstantly();
    render();
    if (!reduceMotion && queue.length) {
      card.animate(
        [{ opacity: 0, transform: "scale(.92)" }, { opacity: 1, transform: "none" }],
        { duration: 180, easing: "ease-out" }
      );
    }
    busy = false;
  }, reduceMotion ? 0 : 260);
}

/* Wischen */
let dragging = false;
let startX = 0;
let dx = 0;

card.addEventListener("pointerdown", (e) => {
  if (busy) return;
  dragging = true;
  startX = e.clientX;
  dx = 0;
  card.setPointerCapture(e.pointerId);
  card.classList.add("dragging");
});
card.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  dx = e.clientX - startX;
  setDrag(dx);
});
function endDrag() {
  if (!dragging) return;
  dragging = false;
  card.classList.remove("dragging");
  if (Math.abs(dx) > THRESHOLD) answer(dx > 0);
  else setDrag(0);
  dx = 0;
}
card.addEventListener("pointerup", endDrag);
card.addEventListener("pointercancel", endDrag);

/* Buttons, Tastatur, Modi */
$("yes").addEventListener("click", () => answer(true));
$("no").addEventListener("click", () => answer(false));
$("restart").addEventListener("click", start);

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") answer(true);
  if (e.key === "ArrowLeft") answer(false);
});

/* Buchstaben-Modi */
document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    mode = btn.dataset.mode;
    start();
  });
});

/* Hauptmodus-Umschalter */
document.querySelectorAll(".main-mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".main-mode").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    mainMode = btn.dataset.mainmode;

    // UI umschalten
    $("letter-modes").hidden = mainMode !== "letters";
    const sylSettings = $("syllable-settings");
    if (mainMode === "syllables") {
      sylSettings.removeAttribute("hidden");
    } else {
      sylSettings.setAttribute("hidden", "");
    }

    start();
  });
});

/* Init */
initSyllableSettings();
start();
