import { Application } from "express";
import * as fs from "fs";
import * as path from "path";
import request from "supertest";
import { disconnectPrisma, initializePrisma } from "../database";

// Force test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./prisma/database.test.sqlite";

let app: Application;

beforeAll(async () => {
  // Remove existing test database to start fresh
  const testDbPath = path.join(
    __dirname,
    "..",
    "..",
    "prisma",
    "database.test.sqlite"
  );
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Create the database schema for testing BEFORE initializing Prisma
  const { execSync } = require("child_process");
  try {
    // Generate client first
    execSync("npx prisma generate", { stdio: "pipe" });

    // Use db push for test environment (creates schema without migration history)
    execSync("npx prisma db push --force-reset", { stdio: "pipe" });
  } catch (error) {
    console.error("Failed to set up test database:", error);
    throw error;
  }

  // NOW initialize Prisma with the created schema
  initializePrisma();

  app = require("../server").default;
});

afterAll(async () => {
  await disconnectPrisma();

  // Clean up test database
  const testDbPath = path.join(
    __dirname,
    "..",
    "..",
    "prisma",
    "database.test.sqlite"
  );
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe("RNG API with User Bindings", () => {
  let userId: number;
  let secondUserId: number;

  test("Sign up user", async () => {
    const res = await request(app).post("/signup").send({
      fullName: "Test User",
      email: "test@example.com",
      password: "test123",
      address: "1 Test St",
      city: "Testville",
      state: "TS",
      zipCode: "00000",
      birthday: "2000-01-01",
    });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.id).toBe("number");
  });

  test("Login user", async () => {
    const res = await request(app).post("/login").send({
      email: "test@example.com",
      password: "test123",
    });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    expect(res.body.fullName).toBe("Test User");
    expect(res.body.email).toBe("test@example.com");
    expect(res.body.password).toBeUndefined(); // Should not include password
    userId = res.body.id;
  });

  test("Create second user for binding tests", async () => {
    const signupRes = await request(app).post("/signup").send({
      fullName: "Second User",
      email: "second@example.com",
      password: "second123",
    });

    expect(signupRes.status).toBe(200);
    secondUserId = signupRes.body.id;
  });

  // User Binding Tests - Updated for new authenticated endpoints
  describe("User Bindings (Authenticated)", () => {
    test("Create user binding with authentication", async () => {
      const res = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(userId))
        .send({
          externalId: "ext_12345",
          type: "external_api",
        });

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.userId).toBe(userId);
      expect(res.body.externalId).toBe("ext_12345");
      expect(res.body.type).toBe("external_api");
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.updatedAt).toBeDefined();
    });

    test("Update existing user binding", async () => {
      const res = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(userId))
        .send({
          externalId: "ext_updated_12345",
          type: "external_api", // Same type, different external ID
        });

      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(userId);
      expect(res.body.externalId).toBe("ext_updated_12345");
      expect(res.body.type).toBe("external_api");
    });

    test("Create multiple bindings for same user", async () => {
      const res1 = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(userId))
        .send({
          externalId: "oauth_67890",
          type: "oauth_provider",
        });

      expect(res1.status).toBe(200);
      expect(res1.body.type).toBe("oauth_provider");

      const res2 = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(userId))
        .send({
          externalId: "payment_abc123",
          type: "payment_provider",
        });

      expect(res2.status).toBe(200);
      expect(res2.body.type).toBe("payment_provider");
    });

    test("Get user bindings with authentication", async () => {
      const res = await request(app)
        .get("/bindings")
        .set("rng-user-id", String(userId));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3); // external_api, oauth_provider, payment_provider

      const types = res.body.map((binding: any) => binding.type);
      expect(types).toContain("external_api");
      expect(types).toContain("oauth_provider");
      expect(types).toContain("payment_provider");
    });

    test("Bindings require authentication", async () => {
      const res = await request(app).put("/bindings").send({
        externalId: "test_123",
        type: "test_type",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    test("Create binding with invalid user ID header", async () => {
      const res = await request(app)
        .put("/bindings")
        .set("rng-user-id", "invalid")
        .send({
          externalId: "test_123",
          type: "test_type",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid user ID");
    });

    test("Create binding with non-existent user", async () => {
      const res = await request(app)
        .put("/bindings")
        .set("rng-user-id", "99999")
        .send({
          externalId: "test_123",
          type: "test_type",
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    test("Create binding with missing data", async () => {
      const res = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(userId))
        .send({
          externalId: "test_123",
          // Missing type
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("External ID and type are required");
    });

    test("Create binding with invalid data types", async () => {
      const res = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(userId))
        .send({
          externalId: 12345, // Should be string
          type: "test_type",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("External ID and type must be strings");
    });

    test("Get bindings requires authentication", async () => {
      const res = await request(app).get("/bindings");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    test("Delete user binding", async () => {
      const res = await request(app)
        .delete("/bindings/oauth_provider")
        .set("rng-user-id", String(userId));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Binding deleted successfully");

      // Verify it's deleted
      const getRes = await request(app)
        .get("/bindings")
        .set("rng-user-id", String(userId));
      expect(getRes.status).toBe(200);
      const types = getRes.body.map((binding: any) => binding.type);
      expect(types).not.toContain("oauth_provider");
    });

    test("Delete non-existent binding", async () => {
      const res = await request(app)
        .delete("/bindings/non_existent_type")
        .set("rng-user-id", String(userId));

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Binding not found");
    });

    test("Delete binding requires authentication", async () => {
      const res = await request(app).delete("/bindings/some_type");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    test("Case insensitive binding types", async () => {
      // Create with uppercase
      const createRes = await request(app)
        .put("/bindings")
        .set("rng-user-id", String(secondUserId))
        .send({
          externalId: "test_case",
          type: "TEST_TYPE",
        });

      expect(createRes.status).toBe(200);
      expect(createRes.body.type).toBe("test_type"); // Should be lowercase

      // Delete with different case
      const deleteRes = await request(app)
        .delete("/bindings/Test_Type")
        .set("rng-user-id", String(secondUserId));

      expect(deleteRes.status).toBe(200);
    });
  });

  // Existing tests continue...
  test("Call /rng and get a number", async () => {
    const res = await request(app)
      .get("/rng")
      .set("rng-user-id", String(userId));

    expect(res.status).toBe(200);
    expect(res.body.number).toBeGreaterThan(0);
    expect(res.body.number).toBeLessThanOrEqual(10000);
    expect(res.body.created_at).toBeDefined();
    expect(new Date(res.body.created_at)).toBeInstanceOf(Date);
  });

  test("RNG requires authentication", async () => {
    const res = await request(app).get("/rng");

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  test("Call /stats and see results", async () => {
    const res = await request(app)
      .get("/stats")
      .set("rng-user-id", String(userId));

    expect(res.status).toBe(200);
    expect(res.body.totalNumbersGenerated).toBeGreaterThan(0);
    expect(res.body.bestNumber).toBeGreaterThan(0);
    expect(typeof res.body.totalNumbersGenerated).toBe("number");
    expect(typeof res.body.bestNumber).toBe("number");
  });

  test("Health check endpoint", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database).toBe("connected");
    expect(res.body.timestamp).toBeDefined();
  });
});
