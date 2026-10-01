// A browser can't block Alt-Tab (the OS handles it), so we swap the scene the
// moment the page loses focus. By the time the visitor comes back it has changed.

const scenes = [
  { id: 'terminal', caption: 'Claude is thinking. You are waiting.' },
  { id: 'image', caption: 'Researching. Strictly work-related.' },
  { id: 'notes', caption: 'Taking notes. Learning a lot.' },
  { id: 'so', caption: 'Googling something. Very important.' },
];

// Only on the terminal scene (every 4th switch), so they never clash with the other captions.
const messages = {
  8: 'Claude finished 7 alt-tabs ago.',
  12: 'Is the code even running anymore?',
};

const TERMINAL_LINES = [
  '> claude',
  '',
  '  Welcome to Claude Code',
  '',
  '> build me a landing page. make it vibe.',
];

const els = {
  scenes: [...document.querySelectorAll('.scene')],
  caption: document.getElementById('caption'),
  hint: document.getElementById('hint'),
  count: document.getElementById('count'),
  term: document.getElementById('term'),
  monitor: document.getElementById('monitor'),
};

let current = 0;
let count = 0;
let lastSwitch = 0;

function show(index) {
  current = index % scenes.length;
  els.scenes.forEach((el) => el.classList.toggle('is-active', el.dataset.scene === scenes[current].id));
  els.caption.textContent = scenes[current].caption;
}

function next(auto = false) {
  // blur and visibilitychange often fire together; count them once
  const now = Date.now();
  if (now - lastSwitch < 400) return;
  lastSwitch = now;
  if (!auto) cancelKeys();

  count += 1;
  els.count.textContent = count;
  show(current + 1);

  if (messages[count]) els.caption.textContent = messages[count];
  resetIdle();
}

// The real trigger: the visitor left the page.
window.addEventListener('blur', () => next());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) next();
});

// Fallbacks for phones, or people who switch with the mouse.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    next();
  }
});
els.monitor.addEventListener('click', () => next());

// If nobody alt-tabs for a while, the keys appear on screen, get "pressed",
// and start fading out; the scene swaps right as they fade.
const IDLE_MS = 10000;
const keys = document.getElementById('keys');
let idleTimer;
let keyTimers = [];

function cancelKeys() {
  keyTimers.forEach(clearTimeout);
  keyTimers = [];
  keys.className = 'keys';
}

function autoAltTab() {
  keys.className = 'keys show';
  const step = (ms, fn) => keyTimers.push(setTimeout(fn, ms));
  step(1100, () => keys.classList.add('press'));
  step(1700, () => {
    keys.classList.remove('press');
    keys.classList.add('fade');
    next(true);
  });
  step(2800, cancelKeys);
}

function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(autoAltTab, IDLE_MS);
}

// Typewriter for the terminal: types once on load, then the screen stays as it
// is and only the "Thinking" line keeps animating, so coming back to the terminal
// scene never retypes anything.
const SPINNER = ['*', '✶', '✻', '✽'];

function typeTerminal() {
  const text = TERMINAL_LINES.join('\n');
  const cursor = () => Object.assign(document.createElement('span'), { className: 'cursor' });
  let i = 0;
  const tick = () => {
    els.term.textContent = text.slice(0, i);
    els.term.append(cursor());
    if (i++ < text.length) setTimeout(tick, 35);
    else thinking(text);
  };
  tick();
}

function thinking(text) {
  const line = document.createElement('span');
  const frame = document.createElement('span');
  const dots = document.createElement('span');
  frame.className = 'spin';
  line.append('\n\n', frame, ' Thinking', dots);
  els.term.replaceChildren(text, line);

  let n = 0;
  const update = () => {
    frame.textContent = SPINNER[n % SPINNER.length];
    dots.textContent = '.'.repeat(n % 4);
    n += 1;
  };
  update();
  setInterval(update, 400);
}

show(0);
typeTerminal();
resetIdle();
