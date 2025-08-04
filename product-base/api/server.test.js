const request = require("supertest");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Force test environment so server.js picks database.test.sqlite
process.env.NODE_ENV = "test";

let app;
beforeAll(() => {
  const dbPath = path.join(__dirname, "database.test.sqlite");
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run("DELETE FROM numbers");
    db.run("DELETE FROM users");
  });

  app = require("./server");
});

describe("RNG API basic flow", () => {
  let userId;

  test("Sign up user", async () => {
    const res = await request(app).post("/signup").send({
      full_name: "Test User",
      email: "test@example.com",
      password: "test123",
      address: "1 Test St",
      city: "Testville",
      state: "TS",
      zip_code: "00000",
      birthday: "2000-01-01",
    });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
  });

  test("Login user", async () => {
    const res = await request(app).post("/login").send({
      email: "test@example.com",
      password: "test123",
    });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    userId = res.body.id;
  });

  test("Call /rng and get a number", async () => {
    const res = await request(app).get("/rng").set("rng-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.number).toBeGreaterThan(0);
  });

  test("Call /stats and see results", async () => {
    const res = await request(app).get("/stats").set("rng-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.totalNumbersGenerated).toBeGreaterThan(0);
    expect(res.body.bestNumber).toBeGreaterThan(0);
  });
});
