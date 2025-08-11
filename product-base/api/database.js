const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const logger = require("./logger");
require("dotenv").config();

const isTestEnv = process.env.NODE_ENV === "test";
const dbFile = isTestEnv ? "database.test.sqlite" : "database.sqlite";
const dbPath = path.join(__dirname, dbFile);

const s3Bucket = process.env.S3_BUCKET;
const s3Key = process.env.S3_DB_KEY || dbFile;
const s3Region = process.env.AWS_REGION;
const isLocalEnv = !process.env.AWS_EXECUTION_ENV;

let s3Client;
if (!isTestEnv && s3Bucket && s3Region) {
  s3Client = new S3Client({ region: s3Region });
}

let db;

async function prepareDatabase() {
  if (fs.existsSync(dbPath)) {
    logger.info(`Initializing database - using existing file at ${dbPath}`);
  } else if (s3Client) {
    try {
      logger.info(
        `Initializing database - downloading from s3://${s3Bucket}/${s3Key}`
      );
      const data = await s3Client.send(
        new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key })
      );
      await streamToFile(data.Body, dbPath);
      logger.success(`Database downloaded to ${dbPath}`);
    } catch (err) {
      logger.warn(
        `Initializing database - failed to download from S3 (${err.message}); creating new file at ${dbPath}`
      );
    }
  } else {
    logger.info(
      `Initializing database - creating new file at ${dbPath} (no S3 configuration detected)`
    );
  }

  db = new sqlite3.Database(dbPath);
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
  logger.success(`Database ready at ${dbPath}`);
  return db;
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

async function shutdownDatabase() {
  if (!db) return;
  return new Promise((resolve) => {
    db.close(async () => {
      if (!s3Client) {
        logger.info("Database teardown - S3 not configured; keeping database locally.");
        return resolve();
      }
      if (isLocalEnv) {
        logger.info("Database teardown - running locally; not uploading to S3.");
        return resolve();
      }
      try {
        const fileBuffer = fs.readFileSync(dbPath);
        await s3Client.send(
          new PutObjectCommand({ Bucket: s3Bucket, Key: s3Key, Body: fileBuffer })
        );
        const now = new Date();
        const day = String(now.getUTCDate()).padStart(2, "0");
        const month = String(now.getUTCMonth() + 1).padStart(2, "0");
        const year = now.getUTCFullYear();
        const hours = String(now.getUTCHours()).padStart(2, "0");
        const minutes = String(now.getUTCMinutes()).padStart(2, "0");
        const seconds = String(now.getUTCSeconds()).padStart(2, "0");
        const archiveKey = `archive/${day}-${month}-${year}/${hours}-${minutes}-${seconds}-database.sqlite`;
        await s3Client.send(
          new PutObjectCommand({
            Bucket: s3Bucket,
            Key: archiveKey,
            Body: fileBuffer,
          })
        );
        logger.success(
          `Database uploaded to S3 and archived at s3://${s3Bucket}/${archiveKey}`
        );
      } catch (err) {
        logger.warn(`Failed to upload database to S3 (${err.message})`);
      }
      resolve();
    });
  });
}

function getDb() {
  return db;
}

module.exports = {
  prepareDatabase,
  shutdownDatabase,
  getDb,
  dbFile,
  dbPath,
  isLocalEnv,
  s3Client,
};
