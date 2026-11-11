const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ".split("");
const LOWER = "abcdefghijklmnopqrstuvwxyzäöüß".split("");
const COLOR_COUNT = 6; // Farben stehen im CSS (--l0 bis --l5)
const THRESHOLD = 90; // Pixel, ab denen ein Wisch zählt

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

let mode = "both";
let queue = [];
let total = 0;
let misses = new Set();
let busy = false;

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

function start() {
  queue = shuffle(buildDeck());
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

document.querySelectorAll(".mode").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((b) => b.setAttribute("aria-pressed", "false"));
    btn.setAttribute("aria-pressed", "true");
    mode = btn.dataset.mode;
    start();
  });
});

start();
