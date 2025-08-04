const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    birthday TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

const app = express();
app.use(express.json());

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT id, full_name, email, address, city, state, zip_code, birthday FROM users WHERE email = ? AND password = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal error' });
    if (!row) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(row);
  });
});

// Signup endpoint
app.post('/signup', (req, res) => {
  const { full_name, email, password, address, city, state, zip_code, birthday } = req.body;
  const check = `SELECT id FROM users WHERE email = ?`;
  db.get(check, [email], (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal error' });
    if (row) return res.status(400).json({ error: 'User already exists' });
    const insert = `INSERT INTO users (full_name, email, password, address, city, state, zip_code, birthday) VALUES (?,?,?,?,?,?,?,?)`;
    db.run(insert, [full_name, email, password, address, city, state, zip_code, birthday], function(err) {
      if (err) return res.status(500).json({ error: 'Internal error' });
      res.json({ id: this.lastID });
    });
  });
});

function getUserId(req) {
  return req.header('rng-user-id');
}

// RNG endpoint
app.get('/rng', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const random = Math.floor(Math.random() * 10000) + 1;
  const insert = `INSERT INTO numbers (user_id, value) VALUES (?, ?)`;
  db.run(insert, [userId, random], err => {
    if (err) return res.status(500).json({ error: 'Internal error' });
    res.json({ number: random });
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const query = `SELECT COUNT(*) as total, MAX(value) as best FROM numbers WHERE user_id = ?`;
  db.get(query, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Internal error' });
    res.json({ totalNumbersGenerated: row.total || 0, bestNumber: row.best || 0 });
  });
});

// Update profile endpoint
app.post('/update-profile', (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { full_name, email, address, city, state, zip_code, birthday } = req.body;
  const update = `UPDATE users SET full_name = ?, email = ?, address = ?, city = ?, state = ?, zip_code = ?, birthday = ? WHERE id = ?`;
  db.run(update, [full_name, email, address, city, state, zip_code, birthday, userId], function(err) {
    if (err) return res.status(500).json({ error: 'Internal error' });
    const select = `SELECT id, full_name, email, address, city, state, zip_code, birthday FROM users WHERE id = ?`;
    db.get(select, [userId], (err, row) => {
      if (err) return res.status(500).json({ error: 'Internal error' });
      res.json(row);
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
