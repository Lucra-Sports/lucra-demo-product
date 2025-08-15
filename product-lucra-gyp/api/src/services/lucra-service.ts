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

interface LucraMatchupResponse {
  id: string;
  createdByUserId: string;
  winnerGroupId?: string;
  gameId: string;
  type: "RECREATIONAL_GAME";
  subtype: "GROUP_VS_GROUP" | "FREE_FOR_ALL";
  buyInAmount: number;
  joinedByUserId?: string;
  groups: Array<{
    groupId: string;
    name: string;
    users: Array<{
      userId: string;
      reward: {
        type: "CASH" | "TENANT_REWARD";
        value: string;
        metadata?: string;
      };
    }>;
  }>;
}

interface LucraWebhookPayload extends LucraMatchupResponse {
  event:
    | "RecreationalGameCreated"
    | "RecreationalGameJoined"
    | "RecreationalGameCanceled"
    | "RecreationalGameCompleted";
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

  async createMatchupFromLucraAPI(matchupId: string): Promise<void> {
    try {
      // Fetch matchup data from Lucra API
      const response = await fetch(
        `${this.apiUrl}/api/rest/recreational-games/${matchupId}?apiKey=${this.apiKey}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch matchup from Lucra: ${response.status} ${response.statusText}`
        );
      }

      const { matchup } = (await response.json()) as {
        matchup: LucraMatchupResponse;
      };
      logger.info("fetched matchup from Lucra API", { matchupId, matchup });

      await this.processMatchupData(matchup);
    } catch (error) {
      throw new Error(
        `Failed to create matchup from Lucra API: ${(error as Error).message}`
      );
    }
  }

  private async processMatchupData(
    payload: LucraMatchupResponse
  ): Promise<void> {
    // Extract all lucra user IDs from the payload
    const matchupRecords = payload.groups.flatMap((group) =>
      group.users.map((user) => ({
        matchupId: payload.id,
        groupId: group.groupId,
        userId: user.userId,
      }))
    );

    // Delete existing records for this matchup to ensure Lucra is source of truth
    await db.deleteLucraMatchupsByMatchupId(payload.id);

    // Insert all matchup records
    if (matchupRecords.length > 0) {
      logger.info("creating lucra matchup from API fetch");
      await db.createManyLucraMatchups(matchupRecords);
    }
  }

  async handleMatchupWebhook(payload: LucraWebhookPayload): Promise<void> {
    try {
      // Store the webhook payload in the lucra_webhooks table
      await db.createLucraWebhook(JSON.stringify(payload));
      logger.info("processing webhook", payload);

      if (payload.event === "RecreationalGameCanceled") {
        logger.info("matchup canceled");
        await db.deleteLucraMatchupsByMatchupId(payload.id);
        return;
      }
      if (payload.event === "RecreationalGameCompleted") {
        logger.info("matchup completed outside rng");
        await db.completeLucraMatchupById(payload.id);
        return;
      }
    } catch (error) {
      throw new Error(
        `Failed to process webhook payload: ${(error as Error).message}`
      );
    }
  }

  async linkNumberToMatchup(number: {
    id: number;
    value: number;
    userId: number;
  }): Promise<boolean> {
    try {
      const userBinding = await db.findUserBinding(number.userId, "lucra");

      if (!userBinding) {
        logger.warn("No Lucra binding found for user", {
          userId: number.userId,
        });
        return false;
      }

      const lucraUserId = userBinding.externalId;
      logger.info("Found Lucra user binding", {
        userId: number.userId,
        lucraUserId,
      });

      const oldestMatchup = await db.findOldestUncompletedLucraMatchup(
        lucraUserId
      );

      if (!oldestMatchup) {
        logger.info("No uncompleted matchups found for user", { lucraUserId });
        return false;
      }

      // Update the matchup with the number ID
      await db.updateLucraMatchupWithNumber(
        oldestMatchup.matchupId,
        oldestMatchup.groupId,
        lucraUserId,
        number.id
      );

      logger.info("Successfully linked number to matchup", {
        numberId: number.id,
        numberValue: number.value,
        matchupId: oldestMatchup.matchupId,
        groupId: oldestMatchup.groupId,
        lucraUserId,
      });

      await this.tryCompletingMatchup(oldestMatchup.matchupId);
      return true;
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

  async tryCompletingMatchup(matchupId: string): Promise<void> {
    try {
      const allMatchupRecords = await db.findUncompletedLucraMatchupRecords(
        matchupId
      );

      if (allMatchupRecords.length === 0) {
        logger.warn("No matchup records found", { matchupId });
        return;
      }

      const hasNullNumbers = allMatchupRecords.some(
        (record) => record.numberId === null
      );

      if (hasNullNumbers) {
        logger.info("Matchup cannot be completed - missing numbers", {
          matchupId,
        });
        return;
      }

      const outcome = this.calculateOutcome(allMatchupRecords);

      logger.info("Completing matchup", {
        matchupId,
        isTie: outcome.isTie,
        winningGroupId: outcome.winningGroupId,
      });

      // Call Lucra API to complete the matchup
      const response = await fetch(
        `${this.apiUrl}/api/rest/recreational-games/${matchupId}/complete`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: this.apiKey,
            outcome: {
              isTie: outcome.isTie,
              winningGroupId: outcome.winningGroupId,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to complete matchup via Lucra API: ${response.status} ${response.statusText}`
        );
      }

      logger.info("Successfully completed matchup via Lucra API", {
        matchupId,
        winningGroupId: outcome.winningGroupId,
        isTie: outcome.isTie,
      });
      await db.completeLucraMatchupById(matchupId);
    } catch (error) {
      logger.error("Failed to complete matchup", {
        error: (error as Error).message,
        matchupId,
      });
      throw new Error(
        `Failed to complete matchup: ${(error as Error).message}`
      );
    }
  }

  private calculateOutcome(
    matchupRecords: Array<{
      matchupId: string;
      groupId: string;
      userId: string;
      numberId: number | null;
      number: { value: number } | null;
    }>
  ): { isTie: boolean; winningGroupId?: string } {
    // Group records by groupId and calculate sum for each group
    const groupScores = new Map<string, number>();

    for (const record of matchupRecords) {
      const groupId = record.groupId;
      const numberValue = record.number?.value || 0;

      if (groupScores.has(groupId)) {
        groupScores.set(groupId, groupScores.get(groupId)! + numberValue);
      } else {
        groupScores.set(groupId, numberValue);
      }
    }

    // Find the highest group score
    const scores = Array.from(groupScores.entries());
    const highestScore = Math.max(...scores.map(([, score]) => score));

    // Get all groups with the highest score
    const winningGroups = scores.filter(([, score]) => score === highestScore);

    const isTie = winningGroups.length > 1;
    const winningGroupId = isTie ? undefined : winningGroups[0][0];

    logger.info("Calculated matchup outcome", {
      groupScores: Object.fromEntries(groupScores),
      highestScore,
      winningGroups: winningGroups.map(([groupId, score]) => ({
        groupId,
        score,
      })),
      isTie,
      winningGroupId,
    });

    return { isTie, winningGroupId };
  }
}
