process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./database.test.sqlite";
process.env.LUCRA_API_URL = "http://localhost:8080";
process.env.LUCRA_API_KEY = "test-api-key";

import { Application } from "express";
import request from "supertest";
import { disconnectPrisma, getPrisma, initializePrisma } from "../database";

global.fetch = jest.fn();

describe("RNG API with User Bindings", () => {
  let app: Application;

  beforeAll(async () => {
    const { execSync } = require("child_process");
    try {
      // Set up environment for child processes
      const testEnv = {
        ...process.env,
        NODE_ENV: "test",
        DATABASE_URL: "file:./database.test.sqlite",
      };

      // Generate Prisma client first
      execSync("npx prisma generate", { stdio: "pipe", env: testEnv });

      // Use db push for test environment (creates schema without migration history)
      execSync("npx prisma db push --force-reset", {
        stdio: "pipe",
        env: testEnv,
      });

      // Initialize Prisma after schema is set up
      initializePrisma();
    } catch (error) {
      console.error("Failed to set up test database:", error);
      throw error;
    }

    app = require("../server").default;
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  let userId: number;
  let secondUserId: number;
  let thirdUserId: number;

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

  test("Create third user for not found tests", async () => {
    const signupRes = await request(app).post("/signup").send({
      fullName: "Third User",
      email: "third@example.com",
      password: "third123",
    });

    expect(signupRes.status).toBe(200);
    thirdUserId = signupRes.body.id;
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

  // RNG and Numbers Controller Tests
  describe("RNG and Numbers Controller", () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    test("RNG requires authentication", async () => {
      const res = await request(app).get("/rng");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Unauthorized");
    });

    describe("linkNumberToMatchup behavior", () => {
      describe("when there is a lucra matchup", () => {
        test("Generate number with Lucra binding and uncompleted matchup", async () => {
          const matchupId = "test-matchup-linking";
          await getPrisma().lucraMatchup.create({
            data: {
              lucraMatchupId: matchupId,
              lucraUserId: "lucra_user_linked",
            },
          });
          await request(app)
            .put("/bindings")
            .set("rng-user-id", String(userId))
            .send({
              externalId: "lucra_user_linked",
              type: "lucra",
            });

          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
              matchup: {
                status: "CONFIRMED",
                startsAt: new Date().toISOString(),
              },
            }),
          } as Response);
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
          } as Response);

          const res = await request(app)
            .get("/rng")
            .set("rng-user-id", String(userId));

          expect(mockFetch).toHaveBeenCalledTimes(2);
          expect(res.status).toBe(200);
          expect(res.body.number).toBeGreaterThan(0);
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.matchupId).toBe(matchupId);
        });

        test("Generate number without Lucra binding for a matchup with a number", async () => {
          const matchupId = "test-matchup-linking-3";
          await getPrisma().lucraMatchup.create({
            data: {
              lucraMatchupId: matchupId,
              lucraUserId: "lucra_user_linked_3",
              numbers: { create: { userId, value: 100 } },
            },
          });
          await request(app)
            .put("/bindings")
            .set("rng-user-id", String(userId))
            .send({
              externalId: "lucra_user_linked_3",
              type: "lucra",
            });

          const res = await request(app)
            .get("/rng")
            .set("rng-user-id", String(userId));

          expect(mockFetch).not.toHaveBeenCalled();
          expect(res.status).toBe(200);
          expect(res.body.number).toBeGreaterThan(0);
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.matchupId).toBe(null);
        });

        test("handles API error gracefully", async () => {
          const matchupId = "test-matchup-linking-2";
          await getPrisma().lucraMatchup.create({
            data: {
              lucraMatchupId: matchupId,
              lucraUserId: "lucra_user_linked_4",
            },
          });
          await request(app)
            .put("/bindings")
            .set("rng-user-id", String(userId))
            .send({
              externalId: "lucra_user_linked_4",
              type: "lucra",
            });
          // Mock API error
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
          } as Response);

          const res = await request(app)
            .get("/rng")
            .set("rng-user-id", String(userId));

          expect(mockFetch).toHaveBeenCalled();
          expect(res.status).toBe(200);
          expect(res.body.number).toBeGreaterThan(0);
          // Number generation should succeed even if Lucra completion fails
        });
      });

      test("Generate number without Lucra binding", async () => {
        // Generate a number for user without Lucra binding
        const res = await request(app)
          .get("/rng")
          .set("rng-user-id", String(thirdUserId));

        expect(res.status).toBe(200);
        expect(res.body.number).toBeGreaterThan(0);
        expect(res.body.createdAt).toBeDefined();
        expect(res.body.matchupId).toBeNull();
        // Should succeed even without binding (just won't link to matchup)
      });
    });
  });

  test("Health check endpoint", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.database).toBe("connected");
    expect(res.body.timestamp).toBeDefined();
  });

  // Lucra Controller Tests
  describe("Lucra Controller", () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

    describe("POST /lucra/webhook", () => {
      test("Create webhook configuration successfully", async () => {
        const webhookConfig = {
          subscriptions: ["FtpMatchupCreated"],
          webhookUrl: "https://test.com/lucra-game-matchups",
          name: "Free to Play Game Matchups Created",
          description: "Sync Game Matchups",
          active: true,
        };

        const mockResponse = { success: true };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        } as Response);

        const res = await request(app)
          .post("/lucra/webhook")
          .send(webhookConfig);

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/api/rest/webhook/configs"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
            body: expect.stringContaining("subscriptions"),
          })
        );
      });

      test("Handle webhook creation error", async () => {
        // Mock fetch to return an error response
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          statusText: "Bad Request",
        } as Response);

        const webhookConfig = {
          subscriptions: ["FtpMatchupCreated"],
          webhookUrl: "https://test.com/webhook",
          active: true,
        };

        const res = await request(app)
          .post("/lucra/webhook")
          .send(webhookConfig);

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Failed to create webhook configuration");
        expect(res.body.message).toContain("Failed to create webhook config");
      });
    });

    describe("POST /lucra/matchup-event", () => {
      test("Handle matchup canceled event", async () => {
        const eventPayload = {
          id: "17aa9ba8",
          event: "TournamentCanceled",
          matchup: {
            id: "matchup-id-1",
          },
        };

        const res = await request(app)
          .post("/lucra/matchup-event")
          .send(eventPayload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Matchup event processed successfully");
      });

      test("Handle matchup completed event", async () => {
        const eventPayload = {
          id: "17aa9ba8",
          event: "TournamentCompleted",
          matchup: {
            id: "matchup-id-1",
          },
        };

        const res = await request(app)
          .post("/lucra/matchup-event")
          .send(eventPayload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Matchup event processed successfully");
      });

      test("Handle tournament user joined event", async () => {
        const matchupId = "test-matchup-user-joined";
        const newUserId = "lucra-user-123";

        const eventPayload = {
          event: "TournamentUserJoined",
          tenantId: "TEST_TENANT",
          newUserId: newUserId,
          matchup: {
            id: matchupId,
            type: "CASH_PERCENTAGE",
            status: "OPEN",
            tenantId: "TEST_TENANT",
            createdAt: "2025-01-17T20:28:20.339716+00:00",
            expiresAt: "2025-01-31T20:00:00.000000+00:00",
            startsAt: "2025-01-20T20:00:00.000000+00:00",
            isPublic: true,
            gameId: "AIR-HOCKEY",
            title: "Test Tournament",
            description: "Test Tournament Description",
            metadataString: "{}",
            locationIds: [],
            fee: 5,
            buyInAmount: 10,
            numberOfParticipants: 1,
            maxParticipants: 10,
            maxAttempts: 3,
            poolNetAmount: 28.5,
            scoringType: "HIGHEST_SCORE",
            privateCode: "TEST123",
            rewardStructure: [],
            users: [
              {
                userId: newUserId,
                userName: "TestUser",
                userAvatarUrl: "https://example.com/avatar.png",
                position: 1,
                positionOverride: null,
                metadataString: "{}",
                score: 0,
                rewardNetAmount: 0,
              },
            ],
          },
        };

        const res = await request(app)
          .post("/lucra/matchup-event")
          .send(eventPayload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Matchup event processed successfully");

        // Verify that a lucra matchup record was created
        const createdMatchup = await getPrisma().lucraMatchup.findFirst({
          where: {
            lucraMatchupId: matchupId,
            lucraUserId: newUserId,
          },
          include: {
            numbers: true,
          },
        });

        expect(createdMatchup).toBeDefined();
        expect(createdMatchup?.lucraMatchupId).toBe(matchupId);
        expect(createdMatchup?.lucraUserId).toBe(newUserId);
        expect(createdMatchup?.numbers).toEqual([]); // Should start empty
      });

      test("Handle tournament user joined event without newUserId", async () => {
        const eventPayload = {
          event: "TournamentUserJoined",
          tenantId: "TEST_TENANT",
          // Missing newUserId
          matchup: {
            id: "test-matchup-missing-user",
            type: "CASH_PERCENTAGE",
            status: "OPEN",
            tenantId: "TEST_TENANT",
            createdAt: "2025-01-17T20:28:20.339716+00:00",
            expiresAt: "2025-01-31T20:00:00.000000+00:00",
            startsAt: "2025-01-20T20:00:00.000000+00:00",
            isPublic: true,
            gameId: "AIR-HOCKEY",
            title: "Test Tournament",
            description: "Test Tournament Description",
            metadataString: "{}",
            locationIds: [],
            fee: 5,
            buyInAmount: 10,
            numberOfParticipants: 1,
            maxParticipants: 10,
            maxAttempts: 3,
            poolNetAmount: 28.5,
            scoringType: "HIGHEST_SCORE",
            privateCode: "TEST123",
            rewardStructure: [],
            users: [],
          },
        };

        const res = await request(app)
          .post("/lucra/matchup-event")
          .send(eventPayload);

        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Failed to process matchup event");
      });
    });
  });
});
