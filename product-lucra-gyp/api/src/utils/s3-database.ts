import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import logger from "../logger";

const isTestEnv = process.env.NODE_ENV === "test";
const dbFile = isTestEnv ? "database.test.sqlite" : "database.sqlite";
const dbPath = path.join(process.cwd(), "prisma", dbFile);

const s3Bucket = process.env.S3_BUCKET;
const s3Key = process.env.S3_DB_KEY || dbFile;
const s3Region = process.env.AWS_REGION;
const isLocalEnv = !process.env.AWS_EXECUTION_ENV;

let s3Client: S3Client | null = null;
if (!isTestEnv && s3Bucket && s3Region) {
  s3Client = new S3Client({ region: s3Region });
}

async function streamToFile(stream: any, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    stream.on("error", reject);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

export async function downloadDatabaseFromS3(): Promise<void> {
  if (fs.existsSync(dbPath)) {
    logger.info(`Database exists at ${dbPath}`);
    return;
  }

  if (!s3Client) {
    logger.info("No S3 configuration - creating new database");
    return;
  }

  try {
    logger.info(`Downloading database from s3://${s3Bucket}/${s3Key}`);
    const data = await s3Client.send(
      new GetObjectCommand({ Bucket: s3Bucket, Key: s3Key })
    );
    await streamToFile(data.Body, dbPath);
    logger.success(`Database downloaded to ${dbPath}`);
  } catch (err) {
    logger.warn(
      `Failed to download from S3 (${
        (err as Error).message
      }); creating new database at ${dbPath}`
    );
  }
}

export async function uploadDatabaseToS3(): Promise<void> {
  if (!s3Client) {
    logger.info("S3 not configured - skipping upload");
    return;
  }

  if (!fs.existsSync(dbPath)) {
    logger.warn("Database file not found - skipping S3 upload");
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(dbPath);

    // Upload current database
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: s3Key,
        Body: fileBuffer,
      })
    );

    logger.success(`Database uploaded to s3://${s3Bucket}/${s3Key}`);
  } catch (err) {
    logger.warn(`Failed to upload database to S3: ${(err as Error).message}`);
  }
}

export { dbFile, dbPath, isLocalEnv };
