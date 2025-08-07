const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();

// Pick DB file based on environment
// Default: database.sqlite
// Test: database.test.sqlite
const isTestEnv = process.env.NODE_ENV === "test";
const dbFile = isTestEnv ? "database.test.sqlite" : "database.sqlite";

// AWS S3 configuration. Credentials are expected via environment variables
// (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION). All are TODOs and
// must be configured in the EB environment and in the local `.env` file.
const s3Bucket = process.env.S3_BUCKET; // TODO: set S3 bucket name
const s3Key = process.env.S3_DB_KEY || dbFile; // TODO: optional custom key
const s3Region = process.env.AWS_REGION; // TODO: AWS region

let s3Client;
if (!isTestEnv && s3Bucket && s3Region) {
  s3Client = new S3Client({ region: s3Region });
}

let db;

function initDatabase() {
  db = new sqlite3.Database(path.join(__dirname, dbFile));
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
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  });
}

async function streamToFile(stream, filePath) {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    stream.on("error", reject);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

async function downloadDbFromS3() {
  if (!s3Client) {
    console.log(
      `Not downloading db from s3 because no .env properties provided!`
    );
    return;
  }
  try {
    const data = await s3Client.send(
      new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key })
    );
    await streamToFile(data.Body, path.join(__dirname, dbFile));
    console.log("Database downloaded from S3");
  } catch (err) {
    console.warn("Skipping S3 download:", err.message);
  }
}

async function uploadDbToS3() {
  if (!s3Client) {
    console.log(`Not uploading db to s3 because no .env properties provided!`);
    return;
  }
  try {
    const filePath = path.join(__dirname, dbFile);
    if (!fs.existsSync(filePath)) return;
    const fileStream = fs.createReadStream(filePath);
    await s3Client.send(
      new PutObjectCommand({ Bucket: s3Bucket, Key: s3Key, Body: fileStream })
    );
    console.log("Database uploaded to S3");
  } catch (err) {
    console.warn("Failed to upload DB to S3:", err.message);
  }
}

if (isTestEnv) {
  initDatabase();
}

const app = express();
app.use(express.json());

// Basic CORS support for local dev
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, rng-user-id"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT id, full_name, email, address, city, state, zip_code, birthday FROM users WHERE email = ? AND password = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    if (!row) return res.status(401).json({ error: "Invalid credentials" });
    res.json(row);
  });
});

// Signup endpoint
app.post("/signup", (req, res) => {
  const {
    full_name,
    email,
    password,
    address,
    city,
    state,
    zip_code,
    birthday,
  } = req.body;

  // First check if email already exists
  const check = `SELECT id FROM users WHERE email = ?`;
  db.get(check, [email], (err, row) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    if (row) {
      // Email is already registered
      return res.status(400).json({ error: "You already have an account" });
    }

    // Insert new user
    const insert = `INSERT INTO users (full_name, email, password, address, city, state, zip_code, birthday) VALUES (?,?,?,?,?,?,?,?)`;
    db.run(
      insert,
      [full_name, email, password, address, city, state, zip_code, birthday],
      function (err) {
        if (err) return res.status(500).json({ error: "Internal error" });
        res.json({ id: this.lastID });
      }
    );
  });
});

function getUserId(req) {
  return req.header("rng-user-id");
}

function requireUser(req, res, next) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const query = `SELECT id FROM users WHERE id = ?`;
  db.get(query, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    if (!row) return res.status(404).json({ error: "User not found" });
    req.userId = userId;
    next();
  });
}

// RNG endpoint
app.get("/rng", requireUser, (req, res) => {
  const userId = req.userId;
  const random = Math.floor(Math.random() * 10000) + 1;
  const insert = `INSERT INTO numbers (user_id, value, created_at) VALUES (?, ?, ?)`;
  const createdAt = new Date().toISOString();
  db.run(insert, [userId, random, createdAt], (err) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    res.json({ number: random, created_at: createdAt });
  });
});

// Stats endpoint
app.get("/stats", requireUser, (req, res) => {
  const userId = req.userId;
  const query = `SELECT COUNT(*) as total, MAX(value) as best FROM numbers WHERE user_id = ?`;
  db.get(query, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    res.json({
      totalNumbersGenerated: row.total || 0,
      bestNumber: row.best || 0,
    });
  });
});

// Paginated numbers history endpoint
app.get("/numbers", requireUser, (req, res) => {
  const userId = req.userId;

  // Ensure limit and page are positive, sane integers to avoid huge
  // queries or SQLite errors when extremely large values are provided.
  const toPositiveInt = (value, defaultValue) => {
    const n = parseInt(value, 10);
    return Number.isSafeInteger(n) && n > 0 ? n : defaultValue;
  };
  const MAX_LIMIT = 100;
  const limit = Math.min(toPositiveInt(req.query.limit, 25), MAX_LIMIT);
  const page = toPositiveInt(req.query.page, 1);
  const offset = (page - 1) * limit;

  const listQuery =
    "SELECT id, value, created_at FROM numbers WHERE user_id = ? ORDER BY id DESC LIMIT ? OFFSET ?";
  db.all(listQuery, [userId, limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: "Internal error" });
    const countQuery =
      "SELECT COUNT(*) as count FROM numbers WHERE user_id = ?";
    db.get(countQuery, [userId], (err2, countRow) => {
      if (err2) return res.status(500).json({ error: "Internal error" });
      const total = countRow.count || 0;
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const nextPage =
        page < totalPages
          ? `${req.protocol}://${req.get("host")}${
              req.path
            }?limit=${limit}&page=${page + 1}`
          : null;
      res.json({ numbers: rows, page, totalPages, next: nextPage });
    });
  });
});

// Update profile endpoint
app.post("/update-profile", requireUser, (req, res) => {
  const userId = req.userId;
  const { full_name, email, address, city, state, zip_code, birthday } =
    req.body;
  const update = `UPDATE users SET full_name = ?, email = ?, address = ?, city = ?, state = ?, zip_code = ?, birthday = ? WHERE id = ?`;
  db.run(
    update,
    [full_name, email, address, city, state, zip_code, birthday, userId],
    function (err) {
      if (err) return res.status(500).json({ error: "Internal error" });
      const select = `SELECT id, full_name, email, address, city, state, zip_code, birthday FROM users WHERE id = ?`;
      db.get(select, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: "Internal error" });
        res.json(row);
      });
    }
  );
});

if (require.main === module) {
  (async () => {
    await downloadDbFromS3();
    initDatabase();
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(
        `API server listening on port ${PORT} using DB file: ${dbFile}. S3 Download and Upload active? ${
          s3Client != null
        }`
      );
    });
  })();

  const shutdown = () => {
    if (!db) return process.exit(0);
    db.close(async () => {
      await uploadDbToS3();
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

module.exports = app;
