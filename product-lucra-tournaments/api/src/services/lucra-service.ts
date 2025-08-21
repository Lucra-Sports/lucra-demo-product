import { LucraMatchup, Number } from "@prisma/client";
import { db } from "../database";
import logger from "../logger";

interface WebhookConfig {
  subscriptions: string[];
  webhookUrl: string;
  name?: string;
  description?: string;
  active: boolean;
  headers?: string;
  expirationDate?: string;
}

interface WebhookConfigPayload {
  apiKey: string;
  object: WebhookConfig;
}

interface LucraMatchupPayload {
  id: string;
  type: "CASH_PERCENTAGE" | string;
  status: "CLOSED" | "OPEN" | "ACTIVE" | string;
  tenantId: string;
  createdAt: string;
  expiresAt: string;
  startsAt: string;
  isPublic: boolean;
  gameId: string;
  title: string;
  description: string;
  metadataString: string;
  locationIds: string[];
  fee: number;
  buyInAmount: number;
  numberOfParticipants: number;
  maxParticipants: number;
  maxAttempts: number;
  poolNetAmount: number;
  scoringType: "HIGHEST_SCORE" | "LOWEST_SCORE";
  privateCode?: string;
  rewardStructure: Array<{
    position: number;
    positionOverride: number | null;
    value: number;
    userId: string;
    userName: string;
    tierNetAmount: number;
  }>;
  users: Array<{
    userId: string;
    userName: string;
    userAvatarUrl: string;
    position: number;
    positionOverride: number | null;
    metadataString: string;
    score: number;
    rewardNetAmount: number;
  }>;
}

interface LucraWebhookPayload {
  event:
    | "TournamentCreated"
    | "TournamentCanceled"
    | "TournamentEdited"
    | "TournamentUserJoined"
    | "TournamentCompleted";
  tenantId: string;
  newUserId?: string;
  matchup: LucraMatchupPayload;
}

export class LucraService {
  private static instance: LucraService;
  private apiUrl: string;
  private apiKey: string;

  private constructor() {
    this.apiUrl = process.env.LUCRA_API_URL || "";
    this.apiKey = process.env.LUCRA_API_KEY || "";

    if (!this.apiUrl || !this.apiKey) {
      throw new Error(
        "LUCRA_API_URL and LUCRA_API_KEY environment variables are required"
      );
    }
  }

  public static getInstance(): LucraService {
    if (!LucraService.instance) {
      LucraService.instance = new LucraService();
    }
    return LucraService.instance;
  }

  async createWebhookConfig(config: WebhookConfig): Promise<any> {
    const payload: WebhookConfigPayload = {
      apiKey: this.apiKey,
      object: config,
    };

    const response = await fetch(`${this.apiUrl}/api/rest/webhook/configs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create webhook config: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async handleMatchupWebhook(payload: LucraWebhookPayload): Promise<void> {
    // Store the webhook payload in the lucra_webhooks table
    await db.createLucraWebhook(JSON.stringify(payload));
    logger.info("processing webhook", payload);
    const { event, matchup, newUserId } = payload;

    switch (event) {
      case "TournamentCanceled":
        logger.info("matchup canceled");
        await db.deleteLucraMatchupsByMatchupId(matchup.id);
        return;
      case "TournamentCompleted":
        // update this
        logger.info("matchup completed outside rng");
        await db.completeLucraMatchupById(matchup.id);
        return;
      case "TournamentUserJoined":
        if (!newUserId) {
          logger.error("Missing user id", {});
          throw new Error();
        }
        await db.createLucraMatchup(matchup.id, newUserId);
        return;

      default:
        logger.info("event not implemented", { event: payload.event });
        return;
    }
  }

  private async submitUserScore(
    matchupId: string,
    number: Number,
    lucraUserId: string
  ) {
    const response = await fetch(
      `${this.apiUrl}/api/rest/pool-tournament/${matchupId}/users-scores`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          object: {
            userScores: [
              {
                userId: lucraUserId,
                score: number.value,
                metadataString: JSON.stringify(number),
                attemptFinished: true, // figure out replay logic
              },
            ],
          },
        }),
      }
    );
    if (!response.ok) {
      logger.error("Failed to submit scores", {
        status: response.status,
        detail: await response.text(),
      });
      throw new Error("Failed to submit scores");
    }
    logger.info("Score submitted", { matchupId, number });
  }

  async linkNumberToMatchup(number: Number): Promise<LucraMatchup | null> {
    try {
      const userBinding = await db.findUserBinding(number.userId, "lucra");

      if (!userBinding) {
        logger.warn("No Lucra binding found for user", {
          userId: number.userId,
        });
        return null;
      }

      const lucraUserId = userBinding.externalId;
      logger.info("Found Lucra user binding", {
        userId: number.userId,
        lucraUserId,
      });

      const matchups = await db.findUncompletedLucraMatchups(lucraUserId);
      const currentMatchup = await this.getMatchupWithRemainingAttempts(
        matchups
      );
      if (!currentMatchup) {
        logger.info(
          "No uncompleted matchups with attempts remaining found for user",
          { lucraUserId }
        );
        return null;
      }
      await this.submitUserScore(currentMatchup.matchupId, number, lucraUserId);
      await db.updateNumberWithMatchup(
        number.id,
        currentMatchup.matchupId,
        lucraUserId
      );

      logger.info("Successfully linked number to matchup", {
        numberId: number.id,
        numberValue: number.value,
        matchupId: currentMatchup.matchupId,
        lucraUserId,
      });

      return currentMatchup;
    } catch (error) {
      logger.error("Failed to link number to matchup", {
        error: (error as Error).message,
        numberId: number.id,
        userId: number.userId,
      });
      throw new Error(
        `Failed to link number to matchup: ${(error as Error).message}`
      );
    }
  }

  private async getMatchupWithRemainingAttempts(
    matchups: Awaited<ReturnType<typeof db.findUncompletedLucraMatchups>>
  ) {
    const lucraMatchups = await Promise.all(
      matchups.map((matchup) => this.getLucraMatchupFromApi(matchup.matchupId))
    );
    const matchupWithRemainingAttempts = matchups.find((matchup, i) => {
      const attemptsTried = matchup.numbers?.length ?? 0;
      const attemptsRemaining = lucraMatchups[i]?.maxAttempts ?? 0;
      return attemptsRemaining > attemptsTried;
    });
    return matchupWithRemainingAttempts;
  }

  private async getLucraMatchupFromApi(matchupId: string) {
    const response = await fetch(
      `${this.apiUrl}/api/rest/pool-tournament/${matchupId}?apiKey=${this.apiKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      logger.error("Failed to retrieve matchup", {
        status: response.status,
        detail: await response.text(),
      });
      throw new Error("Failed to retrieve matchup");
    }
    const { matchup } = (await response.json()) as {
      matchup: LucraMatchupPayload;
    };
    logger.info("Matchup retrieved", { matchup });
    return matchup;
  }
}
