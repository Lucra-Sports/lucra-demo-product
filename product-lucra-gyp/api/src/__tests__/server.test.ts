process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "file:./database.test.sqlite";
process.env.LUCRA_API_URL = "http://localhost:8080";
process.env.LUCRA_API_KEY = "test-api-key";

import { Application } from "express";
import request from "supertest";
import { disconnectPrisma, initializePrisma } from "../database";

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
      test("Generate number with Lucra binding and uncompleted matchup", async () => {
        // Create a Lucra user binding
        await request(app)
          .put("/bindings")
          .set("rng-user-id", String(userId))
          .send({
            externalId: "lucra_user_linked",
            type: "lucra",
          });

        // Create a matchup with this user
        const matchupId = "test-matchup-linking";
        const mockMatchupResponse = {
          matchup: {
            id: matchupId,
            groups: [
              {
                groupId: "group_linked",
                users: [{ userId: "lucra_user_linked" }],
              },
              {
                groupId: "group_other",
                users: [{ userId: "other_user" }],
              },
            ],
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMatchupResponse,
        } as Response);
        await request(app).post("/lucra/matchup").send({ matchupId });

        // Generate a number - should link to the matchup
        const res = await request(app)
          .get("/rng")
          .set("rng-user-id", String(userId));

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(res.body.number).toBeGreaterThan(0);
        expect(res.body.createdAt).toBeDefined();
        expect(res.body.matchupId).toBe(matchupId);
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

      test("Handle matchup completion API error gracefully", async () => {
        const matchupId = "test-error-matchup";
        const mockMatchupResponse = {
          matchup: {
            id: matchupId,
            groups: [
              {
                groupId: "group_error",
                users: [{ userId: "lucra_user_error" }],
              },
            ],
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMatchupResponse,
        } as Response);
        await request(app).post("/lucra/matchup").send({ matchupId });
        expect(mockFetch).toHaveBeenCalled();

        // Mock completion API error
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        } as Response);

        const res = await request(app)
          .get("/rng")
          .set("rng-user-id", String(thirdUserId));

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(res.body.number).toBeGreaterThan(0);
        // Number generation should succeed even if Lucra completion fails
      });

      describe("tryCompletingMatchup and calculateOutcome logic", () => {
        beforeEach(() => {
          mockFetch.mockClear();
        });

        test("Complete 2-group matchup with clear winner", async () => {
          const matchupId = "complete-winner-test";

          // Create test numbers first
          const highNumber = await request(app)
            .get("/rng")
            .set("rng-user-id", String(userId));
          const lowNumber = await request(app)
            .get("/rng")
            .set("rng-user-id", String(secondUserId));

          // Insert lucra_matchup records directly
          const { db } = require("../database");
          await db.createManyLucraMatchups([
            {
              matchupId,
              groupId: "group_high",
              userId: "user_high",
              numberId: highNumber.body.id || 1,
            },
            {
              matchupId,
              groupId: "group_low",
              userId: "user_low",
              numberId: lowNumber.body.id || 2,
            },
          ]);

          // Mock successful completion API response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          } as Response);

          // Import LucraService and call tryCompletingMatchup directly
          const { LucraService } = require("../services/lucra-service");
          const lucraService = LucraService.getInstance();
          await lucraService.tryCompletingMatchup(matchupId);

          // Verify completion API was called with correct parameters
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(
              `/api/rest/recreational-games/${matchupId}/complete`
            ),
            expect.objectContaining({
              method: "PUT",
              headers: expect.objectContaining({
                "Content-Type": "application/json",
              }),
              body: expect.stringContaining('"isTie":false'),
            })
          );

          // Parse the API call body to verify the outcome
          const callArgs = mockFetch.mock.calls[0];
          const body = JSON.parse(callArgs[1]!.body as string);
          expect(body.outcome.isTie).toBe(false);
          expect(body.outcome.winningGroupId).toBeDefined();
        });

        test("Complete 2-group matchup with tie", async () => {
          const matchupId = "complete-tie-test";

          // Create two numbers with same value by manually setting them
          const { db } = require("../database");

          // Create numbers with known values
          const number1 = await db.createNumber(userId, 5000);
          const number2 = await db.createNumber(secondUserId, 5000);

          // Insert lucra_matchup records with same number values
          await db.createManyLucraMatchups([
            {
              matchupId,
              groupId: "group_a",
              userId: "user_a",
              numberId: number1.id,
            },
            {
              matchupId,
              groupId: "group_b",
              userId: "user_b",
              numberId: number2.id,
            },
          ]);

          // Mock successful completion API response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          } as Response);

          // Call tryCompletingMatchup
          const { LucraService } = require("../services/lucra-service");
          const lucraService = LucraService.getInstance();
          await lucraService.tryCompletingMatchup(matchupId);

          // Verify completion API was called with tie=true
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(
              `/api/rest/recreational-games/${matchupId}/complete`
            ),
            expect.objectContaining({
              method: "PUT",
              body: expect.stringContaining('"isTie":true'),
            })
          );

          // Parse and verify tie outcome
          const callArgs = mockFetch.mock.calls[0];
          const body = JSON.parse(callArgs[1]!.body as string);
          expect(body.outcome.isTie).toBe(true);
          expect(body.outcome.winningGroupId).toBeUndefined();
        });

        test("Complete 3-group matchup with sum calculation", async () => {
          const matchupId = "complete-3group-test";

          // Create numbers with known values
          const { db } = require("../database");
          const number1 = await db.createNumber(userId, 1000); // Group A: 1000
          const number2 = await db.createNumber(secondUserId, 2000); // Group A: +2000 = 3000 total
          const number3 = await db.createNumber(thirdUserId, 2500); // Group B: 2500

          // Create a fourth user for group C
          const fourthUser = await request(app).post("/signup").send({
            fullName: "Fourth User Test",
            email: "fourth-test@example.com",
            password: "fourth123",
          });
          const number4 = await db.createNumber(fourthUser.body.id, 1500); // Group C: 1500

          // Insert lucra_matchup records with multiple users per group
          await db.createManyLucraMatchups([
            {
              matchupId,
              groupId: "group_a",
              userId: "user_a1",
              numberId: number1.id,
            },
            {
              matchupId,
              groupId: "group_a", // Same group
              userId: "user_a2",
              numberId: number2.id,
            },
            {
              matchupId,
              groupId: "group_b",
              userId: "user_b1",
              numberId: number3.id,
            },
            {
              matchupId,
              groupId: "group_c",
              userId: "user_c1",
              numberId: number4.id,
            },
          ]);

          // Mock successful completion API response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          } as Response);

          // Call tryCompletingMatchup
          const { LucraService } = require("../services/lucra-service");
          const lucraService = LucraService.getInstance();
          await lucraService.tryCompletingMatchup(matchupId);

          // Verify completion API was called
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(
              `/api/rest/recreational-games/${matchupId}/complete`
            ),
            expect.objectContaining({
              method: "PUT",
              body: expect.stringContaining('"isTie":false'),
            })
          );

          // Parse and verify group_a wins (3000 > 2500 > 1500)
          const callArgs = mockFetch.mock.calls[0];
          const body = JSON.parse(callArgs[1]!.body as string);
          expect(body.outcome.isTie).toBe(false);
          expect(body.outcome.winningGroupId).toBe("group_a");
        });

        test("Matchup with incomplete numbers (should not complete)", async () => {
          const matchupId = "incomplete-test";

          // Create one number
          const { db } = require("../database");
          const number1 = await db.createNumber(userId, 1000);

          // Insert lucra_matchup records where one has no number (null numberId)
          await db.createManyLucraMatchups([
            {
              matchupId,
              groupId: "group_complete",
              userId: "user_complete",
              numberId: number1.id,
            },
            {
              matchupId,
              groupId: "group_incomplete",
              userId: "user_incomplete",
              // numberId intentionally omitted (will be null)
            },
          ]);

          // Call tryCompletingMatchup - should NOT call completion API
          const { LucraService } = require("../services/lucra-service");
          const lucraService = LucraService.getInstance();
          await lucraService.tryCompletingMatchup(matchupId);

          // Verify completion API was NOT called
          expect(mockFetch).not.toHaveBeenCalled();
        });

        test("3-way tie scenario", async () => {
          const matchupId = "3way-tie-test";

          // Create numbers with same values for 3 groups
          const { db } = require("../database");
          const number1 = await db.createNumber(userId, 7777);
          const number2 = await db.createNumber(secondUserId, 7777);
          const number3 = await db.createNumber(thirdUserId, 7777);

          // Insert lucra_matchup records
          await db.createManyLucraMatchups([
            {
              matchupId,
              groupId: "group_x",
              userId: "user_x",
              numberId: number1.id,
            },
            {
              matchupId,
              groupId: "group_y",
              userId: "user_y",
              numberId: number2.id,
            },
            {
              matchupId,
              groupId: "group_z",
              userId: "user_z",
              numberId: number3.id,
            },
          ]);

          // Mock successful completion API response
          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
          } as Response);

          // Call tryCompletingMatchup
          const { LucraService } = require("../services/lucra-service");
          const lucraService = LucraService.getInstance();
          await lucraService.tryCompletingMatchup(matchupId);

          // Verify 3-way tie is detected
          const callArgs = mockFetch.mock.calls[0];
          const body = JSON.parse(callArgs[1]!.body as string);
          expect(body.outcome.isTie).toBe(true);
          expect(body.outcome.winningGroupId).toBeUndefined();
        });

        test("API completion failure handling", async () => {
          const matchupId = "api-fail-test";

          // Set up a complete matchup
          const { db } = require("../database");
          const number1 = await db.createNumber(userId, 9000);
          const number2 = await db.createNumber(secondUserId, 1000);

          await db.createManyLucraMatchups([
            {
              matchupId,
              groupId: "group_winner",
              userId: "user_winner",
              numberId: number1.id,
            },
            {
              matchupId,
              groupId: "group_loser",
              userId: "user_loser",
              numberId: number2.id,
            },
          ]);

          // Mock API failure
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            statusText: "Bad Request",
          } as Response);

          // Call tryCompletingMatchup - should throw error
          const { LucraService } = require("../services/lucra-service");
          const lucraService = LucraService.getInstance();

          await expect(
            lucraService.tryCompletingMatchup(matchupId)
          ).rejects.toThrow("Failed to complete matchup");

          // Verify API was called despite the failure
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(
              `/api/rest/recreational-games/${matchupId}/complete`
            ),
            expect.objectContaining({
              method: "PUT",
            })
          );
        });
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
          event: "RecreationalGameCanceled",
          createdByUserId: "user123",
          gameId: "game789",
          type: "RECREATIONAL_GAME",
          subtype: "GROUP_VS_GROUP",
          buyInAmount: 7,
          groups: [],
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
          event: "RecreationalGameCompleted",
          createdByUserId: "user123",
          gameId: "game789",
          type: "RECREATIONAL_GAME",
          subtype: "GROUP_VS_GROUP",
          buyInAmount: 7,
          groups: [],
        };

        const res = await request(app)
          .post("/lucra/matchup-event")
          .send(eventPayload);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Matchup event processed successfully");
      });
    });

    describe("POST /lucra/matchup", () => {
      test("Create matchup successfully", async () => {
        const matchupId = "17aa9ba8-test-matchup-id";
        const mockMatchupResponse = {
          matchup: {
            id: matchupId,
            gameId: "game123",
            type: "RECREATIONAL_GAME",
            subtype: "GROUP_VS_GROUP",
            buyInAmount: 7,
            groups: [
              {
                groupId: "group123",
                name: "Team 1",
                users: [
                  {
                    userId: "user123",
                    reward: { type: "CASH", value: "15" },
                  },
                ],
              },
            ],
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMatchupResponse,
        } as Response);

        const res = await request(app).post("/lucra/matchup").send({
          matchupId,
        });

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Matchup created successfully");
        expect(res.body.timestamp).toBeDefined();
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/rest/recreational-games/${matchupId}`),
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
          })
        );
      });

      test("Create matchup requires matchup ID", async () => {
        const res = await request(app).post("/lucra/matchup").send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Matchup ID is required");
      });

      test("Create matchup requires string matchup ID", async () => {
        const res = await request(app).post("/lucra/matchup").send({
          matchupId: 123,
        });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Matchup ID must be a string");
      });

      test("Handle create matchup with users (no binding validation)", async () => {
        const matchupId = "test-matchup-id";
        const mockMatchupResponse = {
          matchup: {
            id: matchupId,
            groups: [
              {
                groupId: "group123",
                users: [{ userId: "any_user_123" }],
              },
            ],
          },
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMatchupResponse,
        } as Response);

        const res = await request(app).post("/lucra/matchup").send({
          matchupId,
        });

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Matchup created successfully");
      });

      test("Handle create matchup API error", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: "Not Found",
        } as Response);

        const res = await request(app).post("/lucra/matchup").send({
          matchupId: "test-matchup-id",
        });

        expect(mockFetch).toHaveBeenCalled();
        expect(res.status).toBe(500);
        expect(res.body.error).toBe("Failed to create matchup");
        expect(res.body.message).toContain(
          "Failed to fetch matchup from Lucra"
        );
      });
    });
  });
});
