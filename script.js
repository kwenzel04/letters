const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("");
const LOWER = "abcdefghijklmnopqrstuvwxyzäöüß".split("");
const COLOR_COUNT = 6; // Farben stehen im CSS (--l0 bis --l5)
const THRESHOLD = 90; // Pixel, ab denen ein Wisch zählt

const ALL_VOWELS = ["a", "e", "i", "o", "u", "ä", "ö", "ü", "ei", "eu"];
const ALL_CONSONANTS = [
  "b", "c", "d", "f", "g", "h", "j", "k", "l", "m",
  "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z", "ß"
];

const WORDS_PER_ROUND = 20;

// Feste Silbentrennung für Komposita & Ausnahmen der Grundschule
const COMPOUND_OVERRIDES = {
  // Präfixe mit 2 Silben (über-, unter-, wochen-):
  "überall": "ü·ber·all",
  "überlegen": "ü·ber·le·gen",
  "übernachten": "ü·ber·nach·ten",
  "überraschen": "ü·ber·ra·schen",
  "überzeugen": "ü·ber·zeu·gen",
  "unterbrechen": "un·ter·bre·chen",
  "unterhalten": "un·ter·hal·ten",
  "untersuchen": "un·ter·su·chen",
  "Wochenende": "Wo·chen·en·de",

  // Doppelvokale & Fremdwörter:
  "Kaffee": "Kaf·fee",
  "Idee": "I·dee",
  "Kakao": "Ka·kao",
  "Ozean": "O·ze·an",
  "Museum": "Mu·se·um",
  "Theater": "The·a·ter",
  "Familie": "Fa·mi·lie",
  "Linie": "Li·nie",
  "Ferien": "Fe·ri·en",

  // Komposita:
  "Fußball": "Fuß·ball",
  "Spielplatz": "Spiel·platz",
  "Spielzeug": "Spiel·zeug",
  "Geburtstag": "Ge·burts·tag",
  "Schwimmbad": "Schwimm·bad",
  "Donnerstag": "Don·ners·tag",
  "Dienstag": "Diens·tag",
  "Mittwoch": "Mitt·woch",
  "Freitag": "Frei·tag",
  "Samstag": "Sams·tag",
  "Sonntag": "Sonn·tag",
  "Montag": "Mon·tag",
  "Frühstück": "Früh·stück",
  "frühstücken": "früh·stü·cken",
  "Weihnachten": "Weih·nach·ten",
  "Zuschauer": "Zu·schau·er",
  "Werkstatt": "Werk·statt",
  "Taschentuch": "Ta·schen·tuch",
  "Flugzeug": "Flug·zeug",
  "Sonnenblume": "Son·nen·blu·me",
  "Schneemann": "Schnee·mann",
  "Eisenbahn": "Ei·sen·bahn",
  "Krankenhaus": "Kran·ken·haus",
  "Kindergarten": "Kin·der·gar·ten",
  "Handschuh": "Hand·schuh",
  "Handschuhe": "Hand·schu·he",
  "Schulhof": "Schul·hof",
  "Haustür": "Haus·tür",
  "Turnschuh": "Turn·schuh",
  "Zahnbürste": "Zahn·bürs·te",

  // Spezielle Verben mit abtrennbarer Vorsilbe:
  "einladen": "ein·la·den",
  "einzeln": "ein·zeln",
  "einfach": "ein·fach",
  "vorbereiten": "vor·be·rei·ten",
  "vorstellen": "vor·stel·len",
  "Vorhang": "Vor·hang",
  "Vorsicht": "Vor·sicht",
  "vorsichtig": "vor·sich·tig",
  "warmhalten": "warm·hal·ten",
  "hinlegen": "hin·le·gen",
  "hinsetzen": "hin·set·zen",
  "umarmen": "um·ar·men",
  "umdrehen": "um·dre·hen",
  "umziehen": "um·zie·hen",
  "Abend": "A·bend",
  "bequem": "be·quem",
  "Krokodil": "Kro·ko·dil",
  "Schokolade": "Scho·ko·la·de",
  "telefonieren": "te·le·fo·nie·ren",
  "spazieren": "spa·zie·ren",

  // Verben mit Präfix ver-, er-, be-, zer-, ent-:
  "verändern": "ver·än·dern",
  "verbieten": "ver·bie·ten",
  "verbinden": "ver·bin·den",
  "verbrennen": "ver·bren·nen",
  "verbringen": "ver·brin·gen",
  "verdienen": "ver·die·nen",
  "vergessen": "ver·ges·sen",
  "vergleichen": "ver·glei·chen",
  "verstecken": "ver·ste·cken",
  "verstehen": "ver·ste·hen",
  "versuchen": "ver·su·chen",
  "vertrauen": "ver·trau·en",
  "verwandeln": "ver·wan·deln",
  "verzeihen": "ver·zei·hen",

  "erfinden": "er·fin·den",
  "erhalten": "er·hal·ten",
  "erinnern": "er·in·nern",
  "erkälten": "er·käl·ten",
  "erklären": "er·klä·ren",
  "erlauben": "er·lau·ben",
  "erleben": "er·le·ben",
  "erreichen": "er·rei·chen",
  "erschrecken": "er·schre·cken",
  "erzählen": "er·zäh·len",

  "beschreiben": "be·schrei·ben",
  "betrügen": "be·trü·gen",
  "bestellen": "be·stel·len",
  "zerstören": "zer·stö·ren",
  "entdecken": "ent·de·cken"
};

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

let mainMode = "letters"; // "letters", "syllables" oder "words"
let mode = "both"; // für Buchstaben: "both", "upper", "lower"
let queue = [];
let total = 0;
let misses = new Set();
let busy = false;

// Einstellungen
let colorSyllables = localStorage.getItem("letters_color_syllables") !== "false"; // Standard: an
let syllableCount = 2; // für Silben-Modus (1, 2, 3, 4)
let wordSyllableFilter = "all"; // für Wörter-Modus ("all", 1, 2, 3, 4)
let activeVowels = new Set(["a", "e", "i", "o", "u", "ä", "ö", "ü", "ei", "eu"]);
let activeConsonants = new Set(ALL_CONSONANTS);

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildLetterDeck() {
  if (mode === "upper") return [...UPPER];
  if (mode === "lower") return [...LOWER];
  return [...UPPER, ...LOWER];
}

/* ---- Silbentrennung nach Grundschulregeln ---- */
function splitWordIntoSyllables(word) {
  if (COMPOUND_OVERRIDES[word]) {
    return COMPOUND_OVERRIDES[word].split("·");
  }

  // Ersetze qu temporär durch Q (damit u nicht als eigener Vokalkern zählt)
  let clean = word.replace(/qu/gi, (match) => match[0] === 'Q' ? 'Q' : 'q');

  // Doppelvokale ee, aa, oo als 1 Vokalkern (Langvokale)
  const vRegex = /(ei|ey|ai|ay|eu|äu|au|ie|ee|aa|oo|[aeiouyäöü])/gi;
  const vowels = [];
  let m;
  while ((m = vRegex.exec(clean)) !== null) {
    vowels.push({ index: m.index, length: m[0].length });
  }

  if (vowels.length <= 1) return [word];

  const syllables = [];
  let lastIdx = 0;

  for (let i = 0; i < vowels.length - 1; i++) {
    const v1 = vowels[i];
    const v2 = vowels[i + 1];
    const consStart = v1.index + v1.length;
    const consEnd = v2.index;
    const cons = clean.substring(consStart, consEnd);

    let splitAt = 0;
    const consLower = cons.toLowerCase();

    if (cons.length === 0) {
      splitAt = 0;
    } else if (cons.length === 1) {
      splitAt = 0;
    } else if (consLower === "ch" || consLower === "sch" || consLower === "ph" || consLower === "th" || consLower === "ck") {
      splitAt = 0;
    } else if (consLower.endsWith("sch")) {
      splitAt = cons.length - 3;
    } else if (consLower.endsWith("ch")) {
      splitAt = cons.length - 2;
    } else if (consLower.endsWith("ck")) {
      splitAt = 0;
    } else if (cons.length === 2) {
      splitAt = 1;
    } else if (cons.length >= 3) {
      if (consLower.endsWith("st")) {
        splitAt = cons.length - 2;
      } else {
        splitAt = cons.length - 1;
      }
    }

    const cutPoint = consStart + splitAt;
    syllables.push(word.substring(lastIdx, cutPoint));
    lastIdx = cutPoint;
  }

  syllables.push(word.substring(lastIdx));
  return syllables;
}

/* ---- Silben-Generator (Fantasiewörter mit Silben-Markierung) ---- */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSyllableWord(numSyllables, vowels, consonants) {
  const startWithVowel = Math.random() < 0.5;
  const syllables = [];
  for (let i = 0; i < numSyllables; i++) {
    let syl = "";
    if (startWithVowel) {
      syl = pickRandom(vowels) + pickRandom(consonants);
    } else {
      syl = pickRandom(consonants) + pickRandom(vowels);
    }
    syllables.push(syl);
  }
  if (Math.random() < 0.5 && syllables.length > 0) {
    syllables[0] = syllables[0].charAt(0).toUpperCase() + syllables[0].slice(1);
  }
  return syllables.join("·");
}

function buildSyllableDeck() {
  const vowels = [...activeVowels];
  const consonants = [...activeConsonants].filter(c => c !== "ß");

  if (vowels.length === 0 || consonants.length === 0) {
    return ["---"];
  }

  const words = new Set();
  let attempts = 0;
  while (words.size < WORDS_PER_ROUND && attempts < 250) {
    words.add(generateSyllableWord(syllableCount, vowels, consonants));
    attempts++;
  }
  return [...words];
}

/* ---- Wörter-Modus (Grundwortschatz Grundschule) ---- */
function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-zäöüß]/g, "");
  const matches = w.match(/(?:ei|ey|ai|ay|eu|äu|au|ie|[aeiouyäöü])/g);
  return matches ? matches.length : 1;
}

function getMatchingWords() {
  if (typeof BASIC_WORDS === "undefined" || !Array.isArray(BASIC_WORDS)) {
    return [];
  }

  const allowed = new Set();
  activeVowels.forEach(v => {
    v.toLowerCase().split("").forEach(ch => allowed.add(ch));
  });
  activeConsonants.forEach(c => {
    allowed.add(c.toLowerCase());
  });

  return BASIC_WORDS.filter(word => {
    if (wordSyllableFilter !== "all") {
      const s = countSyllables(word);
      const target = parseInt(wordSyllableFilter, 10);
      if (target === 4) {
        if (s < 4) return false;
      } else if (s !== target) {
        return false;
      }
    }
    const chars = word.toLowerCase().split("");
    return chars.every(ch => allowed.has(ch));
  });
}

function updateWordsCountInfo() {
  const infoEl = $("words-found-info");
  const textEl = $("words-count-text");
  if (!infoEl || !textEl) return;

  if (mainMode !== "words") {
    infoEl.hidden = true;
    return;
  }
  infoEl.hidden = false;
  const matches = getMatchingWords();
  const count = matches.length;
  if (count === 0) {
    textEl.textContent = "Keine Wörter mit diesen Buchstaben";
    textEl.style.color = "var(--no)";
  } else {
    textEl.textContent = `${count} ${count === 1 ? "Wort" : "Wörter"} verfügbar`;
    textEl.style.color = "var(--muted)";
  }
}

function buildWordsDeck() {
  const matches = getMatchingWords();
  if (matches.length === 0) {
    return [];
  }
  const shuffled = shuffle([...matches]);
  const picked = shuffled.slice(0, Math.min(WORDS_PER_ROUND, shuffled.length));
  // Wörter mit Silbentrennzeichen vorbereiten
  return picked.map(w => splitWordIntoSyllables(w).join("·"));
}

/* ---- UI: Einstellungen & Toggles ---- */
function initSettingsUI() {
  const vowelContainer = $("vowel-toggles");
  const consonantContainer = $("consonant-toggles");

  // Vokal-Buttons
  ALL_VOWELS.forEach(v => {
    const btn = document.createElement("button");
    btn.className = "letter-toggle";
    if (v.length > 1) btn.classList.add("letter-toggle-wide");
    btn.textContent = v.toUpperCase();
    btn.dataset.letter = v;
    btn.setAttribute("aria-pressed", activeVowels.has(v) ? "true" : "false");
    btn.addEventListener("click", () => {
      const active = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!active));
      if (active) activeVowels.delete(v);
      else activeVowels.add(v);
      updateWordsCountInfo();
      start();
    });
    vowelContainer.appendChild(btn);
  });

  // Konsonanten-Buttons
  ALL_CONSONANTS.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "letter-toggle";
    btn.textContent = c === "ß" ? "ß" : c.toUpperCase();
    btn.dataset.letter = c;
    btn.setAttribute("aria-pressed", activeConsonants.has(c) ? "true" : "false");
    btn.addEventListener("click", () => {
      const active = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!active));
      if (active) activeConsonants.delete(c);
      else activeConsonants.add(c);
      updateWordsCountInfo();
      start();
    });
    consonantContainer.appendChild(btn);
  });

  // Silbenanzahl-Buttons
  document.querySelectorAll(".syl-count").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".syl-count").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      if (mainMode === "words") {
        wordSyllableFilter = btn.dataset.count;
      } else {
        syllableCount = parseInt(btn.dataset.count, 10);
      }
      updateWordsCountInfo();
      start();
    });
  });

  // Silbenfarben Umschalter (Bunt / Aus)
  document.querySelectorAll(".syl-color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".syl-color-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      colorSyllables = btn.dataset.color === "on";
      localStorage.setItem("letters_color_syllables", String(colorSyllables));
      render(); // Sofort neu einfärben ohne Stapel neu zu mischen
    });
  });

  // Schnellwahl: Vokale Alle / Keine
  $("vowels-all").addEventListener("click", () => {
    ALL_VOWELS.forEach(v => activeVowels.add(v));
    document.querySelectorAll("#vowel-toggles .letter-toggle").forEach(btn => {
      btn.setAttribute("aria-pressed", "true");
    });
    updateWordsCountInfo();
    start();
  });

  $("vowels-none").addEventListener("click", () => {
    activeVowels.clear();
    document.querySelectorAll("#vowel-toggles .letter-toggle").forEach(btn => {
      btn.setAttribute("aria-pressed", "false");
    });
    updateWordsCountInfo();
    start();
  });

  // Schnellwahl: Konsonanten Alle / Keine
  $("consonants-all").addEventListener("click", () => {
    ALL_CONSONANTS.forEach(c => activeConsonants.add(c));
    document.querySelectorAll("#consonant-toggles .letter-toggle").forEach(btn => {
      btn.setAttribute("aria-pressed", "true");
    });
    updateWordsCountInfo();
    start();
  });

  $("consonants-none").addEventListener("click", () => {
    activeConsonants.clear();
    document.querySelectorAll("#consonant-toggles .letter-toggle").forEach(btn => {
      btn.setAttribute("aria-pressed", "false");
    });
    updateWordsCountInfo();
    start();
  });
}

function updateModeVisibility() {
  $("letter-modes").hidden = mainMode !== "letters";

  const settingsEl = $("syllable-settings");
  if (mainMode === "letters") {
    settingsEl.setAttribute("hidden", "");
  } else {
    settingsEl.removeAttribute("hidden");
  }

  const allSylBtn = $("syl-count-all");
  if (allSylBtn) {
    allSylBtn.hidden = mainMode !== "words";
  }

  document.querySelectorAll("#vowel-toggles .letter-toggle-wide").forEach(btn => {
    btn.hidden = mainMode === "words";
  });

  document.querySelectorAll(".syl-count").forEach(b => {
    if (mainMode === "words") {
      b.setAttribute("aria-pressed", b.dataset.count === wordSyllableFilter ? "true" : "false");
    } else {
      b.setAttribute("aria-pressed", b.dataset.count === String(syllableCount) ? "true" : "false");
    }
  });

  // Silbenfarben-Buttons synchronisieren
  document.querySelectorAll(".syl-color-btn").forEach(b => {
    b.setAttribute("aria-pressed", (colorSyllables && b.dataset.color === "on") || (!colorSyllables && b.dataset.color === "off") ? "true" : "false");
  });

  updateWordsCountInfo();
}

/* ---- Start ---- */
function start() {
  if (mainMode === "letters") {
    queue = shuffle(buildLetterDeck());
  } else if (mainMode === "syllables") {
    queue = shuffle(buildSyllableDeck());
  } else if (mainMode === "words") {
    queue = buildWordsDeck();
  }
  total = queue.length;
  misses = new Set();
  render();
}

function render() {
  // Sonderfall: Im Wörtermodus wurden keine passenden Wörter gefunden
  if (mainMode === "words" && total === 0) {
    deck.hidden = false;
    doneEl.hidden = true;
    answersEl.hidden = true;
    ghost.hidden = true;
    barEl.style.width = "0%";
    progressEl.setAttribute("aria-valuenow", 0);
    countEl.textContent = "0 Wörter";

    card.classList.add("syllable-card");
    letterEl.textContent = "Keine Wörter gefunden";
    letterEl.style.fontSize = "clamp(18px, 4.5vw, 26px)";
    letterEl.style.whiteSpace = "normal";
    letterEl.style.lineHeight = "1.3";
    card.dataset.c = 1;
    return;
  }

  letterEl.style.whiteSpace = "nowrap";
  letterEl.style.lineHeight = "";

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

  const rawItem = queue[0];
  const cleanWord = rawItem.replace(/·/g, "");

  // Wort darstellen: entweder mit farbigen Silben oder einfarbig
  if ((mainMode === "syllables" || mainMode === "words") && colorSyllables) {
    const parts = rawItem.split("·");
    letterEl.textContent = "";
    parts.forEach((part, idx) => {
      const span = document.createElement("span");
      span.className = `syl-part-${idx % 2}`;
      span.textContent = part;
      letterEl.appendChild(span);
    });
  } else {
    letterEl.textContent = cleanWord;
  }

  // Schriftgröße dynamisch anpassen
  if (mainMode === "syllables" || mainMode === "words") {
    card.classList.add("syllable-card");
    const len = cleanWord.length;
    const cardWidth = card.clientWidth || 300;
    const px = Math.min(cardWidth * 0.8, Math.max(32, (cardWidth * 1.3) / len));
    letterEl.style.fontSize = px + "px";
  } else {
    card.classList.remove("syllable-card");
    letterEl.style.fontSize = "";
  }

  // Kartenfarbe: für Buchstaben oder wenn Silbenfarben aus sind
  card.dataset.c = cleanWord.toLowerCase().charCodeAt(0) % COLOR_COUNT;
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
  card.classList.add("dragging");
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
      queue.push(current);
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

/* Buttons, Tastatur */
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

    updateModeVisibility();
    start();
  });
});

/* Init */
initSettingsUI();
updateModeVisibility();
start();
