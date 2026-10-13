const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database(':memory:');
const PORT = process.env.PORT || 3000;
const FLAG = process.env.FLAG || 'CTF{cors_sqli_and_design_failures}';

app.use(express.json());

// Intentional CTF vulnerability: reflected-origin, credentialed CORS.
// Any origin is echoed back with credentials allowed, enabling cross-origin
// requests to read authenticated API responses.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static('public'));


db.serialize(() => {
  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)');
  db.run("INSERT INTO users VALUES (1, 'admin', 'super_secret_admin_password', 'admin')");
  db.run("INSERT INTO users VALUES (2, 'player', 'welcome123', 'user')");
});

// Intentional CTF vulnerability: user input is directly interpolated into SQL.
app.post('/api/login', (req, res) => {
  const { username = '', password = '' } = req.body;
  const sql = `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}'`;
  db.get(sql, (err, user) => {
    // Intentional CTF vulnerability: disclose the SQL query in database errors.
    if (err) return res.status(500).json({ error: err.message, query: sql });
    // if (err) return res.status(500).json({ error: 'Unable to process login.' });
    // Intentional CTF vulnerability: disclose the SQL query for failed logins.
    if (!user) return res.status(401).json({ error: 'Invalid credentials', query: sql });
    // if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    // Intentional insecure design: identity is trusted from a client-controlled header on later requests.
    // Intentional CTF vulnerability: disclose the SQL query after successful login.
    res.json({ ok: true, user, debug: { query: sql } });
    // res.json({ ok: true, user });
  });
});

// Notes intentionally live in process memory and disappear on restart.
const notes = [];

// Intentional insecure design: no authentication/session; caller picks any username via X-User.
app.get('/api/notes', (req, res) => {
  const owner = req.header('X-User') || 'guest';
  res.json({ owner, notes: notes.filter(note => note.owner === owner), adminHint: owner === 'admin' ? FLAG : undefined });
});

app.post('/api/notes', (req, res) => {
  const owner = req.header('X-User') || 'guest';
  const text = String(req.body.text || '').slice(0, 500);
  if (!text.trim()) return res.status(400).json({ error: 'A note needs text.' });
  const note = { id: Date.now(), owner, text, createdAt: new Date().toISOString() };
  notes.unshift(note);
  res.status(201).json(note);
});

// Serve OpenAPI specification
app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'openapi.json'));
});

app.listen(PORT, () => console.log(`Vuln Notes CTF listening on ${PORT}`));
