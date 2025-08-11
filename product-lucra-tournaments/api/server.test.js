const request = require("supertest");
const fs = require("fs");
const path = require("path");

// Force test environment so server.js picks database.test.sqlite
process.env.NODE_ENV = "test";

let app;
beforeAll(() => {
  const dbPath = path.join(__dirname, "database.test.sqlite");
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
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

  test("Paginated /numbers returns history", async () => {
    // generate additional numbers
    await request(app).get("/rng").set("rng-user-id", userId);
    await request(app).get("/rng").set("rng-user-id", userId);

    const res = await request(app)
      .get("/numbers?limit=2&page=1")
      .set("rng-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.numbers).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(2);
    expect(res.body.next).toBeTruthy();
    expect(res.body.numbers[0].id).toBeGreaterThan(res.body.numbers[1].id);
    expect(res.body.numbers[0].created_at).toBeDefined();

    const res2 = await request(app)
      .get("/numbers?limit=2&page=2")
      .set("rng-user-id", userId);

    expect(res2.status).toBe(200);
    expect(res2.body.page).toBe(2);
  });

  test("Huge limit does not crash /numbers", async () => {
    const res = await request(app)
      .get("/numbers?limit=1000000000000000000000")
      .set("rng-user-id", userId);

    expect(res.status).toBe(200);
    expect(res.body.numbers.length).toBeGreaterThan(0);
  });

  test("Returns 404 for non-existent user", async () => {
    const res = await request(app).get("/rng").set("rng-user-id", 9999);
    expect(res.status).toBe(404);

    const res2 = await request(app)
      .post("/update-profile")
      .set("rng-user-id", 9999)
      .send({
        full_name: "No User",
        email: "nouser@example.com",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        birthday: "2000-01-01",
      });
    expect(res2.status).toBe(404);
  });
});
