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
}
