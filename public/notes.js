const currentUser = localStorage.getItem('vuln-notes-user') || 'guest';

// ── JS Runner ──────────────────────────────────────────────────────────────
const outputEl  = document.querySelector('#js-output');
const codeEl    = document.querySelector('#js-code');
const clearBtn  = document.querySelector('#js-clear');

function appendOutput(text, cls) {
  // Remove the placeholder on first real output
  const placeholder = outputEl.querySelector('.empty');
  if (placeholder) placeholder.remove();

  const line = document.createElement('div');
  line.className = cls || '';
  line.textContent = text;
  outputEl.appendChild(line);
  outputEl.scrollTop = outputEl.scrollHeight;
}

function runCode(code) {
  // Intercept console methods
  const originals = {};
  ['log', 'warn', 'error', 'info', 'debug'].forEach(method => {
    originals[method] = console[method];
    console[method] = (...args) => {
      const text = args.map(a => {
        try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
        catch { return String(a); }
      }).join(' ');
      const cls = method === 'error' ? 'out-error'
                : method === 'warn'  ? 'out-warn'
                : 'out-log';
      appendOutput(`[${method}] ${text}`, cls);
      originals[method].apply(console, args);
    };
  });

  try {
    const result = eval(code); // intentionally direct eval — it's a CTF sandbox
    if (result !== undefined) {
      try { appendOutput('→ ' + (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)), 'out-return'); }
      catch { appendOutput('→ ' + String(result), 'out-return'); }
    }
  } catch (err) {
    appendOutput(`[error] ${err.name}: ${err.message}`, 'out-error');
  } finally {
    // Restore console
    ['log', 'warn', 'error', 'info', 'debug'].forEach(m => { console[m] = originals[m]; });
  }
}

document.querySelector('#js-form').addEventListener('submit', e => {
  e.preventDefault();
  const code = codeEl.value.trim();
  if (!code) return;
  appendOutput('─'.repeat(40), 'out-sep');
  runCode(code);
});

clearBtn.addEventListener('click', () => {
  outputEl.innerHTML = '<span class="empty">No output yet.</span>';
});

// Allow Shift+Enter to run, Enter to newline
codeEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.shiftKey) {
    e.preventDefault();
    document.querySelector('#js-form').dispatchEvent(new Event('submit'));
  }
});

// ── runme.js button ────────────────────────────────────────────────────────
document.querySelector('#run-runme-btn').addEventListener('click', async () => {
  appendOutput('─'.repeat(40), 'out-sep');
  appendOutput('[runme] Fetching /runme.js…', 'out-log');
  try {
    // Cache-bust so every click fetches the latest version of the file.
    const r = await fetch('/runme.js?_=' + Date.now());
    if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
    const code = await r.text();
    appendOutput('[runme] Running…', 'out-log');
    runCode(code);
  } catch (err) {
    appendOutput(`[runme] Failed to load runme.js — ${err.message}`, 'out-error');
  }
});


// --- Notes ---
const notesListEl = document.querySelector('#notes-list');
const noteMsgEl   = document.querySelector('#note-msg');

async function loadNotes() {
  const r = await fetch('/api/notes', { headers: { 'X-User': currentUser } });
  const data = await r.json();
  notesListEl.innerHTML = data.notes.length
    ? data.notes.map(n => `<article><p>${n.text}</p><small>${new Date(n.createdAt).toLocaleString()}</small></article>`).join('')
    : '<p class="empty">No notes yet.</p>';
}

document.querySelector('#note-form').addEventListener('submit', async e => {
  e.preventDefault();
  const text = document.querySelector('#note-text').value.trim();
  if (!text) return;
  const r = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User': currentUser },
    body: JSON.stringify({ text }),
  });
  const data = await r.json();
  noteMsgEl.textContent = r.ok ? 'Note saved!' : `Error: ${data.error}`;
  if (r.ok) { e.target.reset(); loadNotes(); }
});

loadNotes();

// --- URL redirect ---
document.querySelector('#redirect-form').addEventListener('submit', e => {
  e.preventDefault();
  window.location = document.querySelector('#redirect-url').value;
});

// --- Dropdown Poll ---
document.querySelector('#dropdown-form').addEventListener('submit', e => {
  e.preventDefault();
  const select = document.querySelector('#topic-select');
  const selected = select.value;
  if (!selected) return;

  const resultEl  = document.querySelector('#dropdown-result');
  const outputEl2 = document.querySelector('#dropdown-output');
  const ts = new Date().toLocaleTimeString();

  outputEl2.textContent = `✅ You selected: "${selected}"  (submitted at ${ts})`;
  resultEl.hidden = false;
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
