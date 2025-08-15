import { PrismaClient } from "@prisma/client";
import logger from "./logger";
import { uploadDatabaseToS3 } from "./utils/s3-database";

// Global Prisma instance
let prisma: PrismaClient;

// Initialize Prisma Client
export function initializePrisma(): PrismaClient {
  if (prisma) {
    return prisma;
  }

  prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

  logger.success("✅ Prisma Client initialized");
  return prisma;
}

// Get Prisma instance
export function getPrisma(): PrismaClient {
  if (!prisma) {
    return initializePrisma();
  }
  return prisma;
}

// Graceful shutdown with S3 upload
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info("🔌 Prisma Client disconnected");

    // Upload database to S3 on shutdown
    await uploadDatabaseToS3();
  }
}

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = getPrisma();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error(`❌ Database connection failed: ${(error as Error).message}`);
    return false;
  }
}

// Database utilities
export class DatabaseService {
  private client: PrismaClient;

  constructor() {
    this.client = getPrisma();
  }

  // User operations
  async findUserByEmail(email: string) {
    return this.client.user.findUnique({
      where: { email },
    });
  }

  async findUserById(id: number) {
    return this.client.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: {
    fullName: string;
    email: string;
    password: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    birthday?: string;
  }) {
    return this.client.user.create({
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        birthday: true,
      },
    });
  }

  async updateUser(
    id: number,
    data: {
      fullName?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      birthday?: string;
    }
  ) {
    return this.client.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        birthday: true,
      },
    });
  }

  async authenticateUser(email: string, password: string) {
    return this.client.user.findFirst({
      where: {
        email,
        password,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        birthday: true,
      },
    });
  }

  // Number operations
  async createNumber(userId: number, value: number) {
    return this.client.number.create({
      data: {
        userId,
        value,
      },
      select: {
        id: true,
        userId: true,
        value: true,
        createdAt: true,
      },
    });
  }

  async getUserStats(userId: number) {
    const stats = await this.client.number.aggregate({
      where: { userId },
      _count: true,
      _max: {
        value: true,
      },
    });

    return {
      totalNumbersGenerated: stats._count,
      bestNumber: stats._max.value || 0,
    };
  }

  async getUserNumbers(
    userId: number,
    options: {
      limit: number;
      page: number;
    }
  ) {
    const { limit, page } = options;
    const offset = (page - 1) * limit;

    const [numbers, total] = await Promise.all([
      this.client.number.findMany({
        where: { userId },
        select: {
          id: true,
          value: true,
          createdAt: true,
        },
        orderBy: {
          id: "desc",
        },
        take: limit,
        skip: offset,
      }),
      this.client.number.count({
        where: { userId },
      }),
    ]);

    return {
      numbers,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  // User Binding operations
  async createUserBinding(data: {
    userId: number;
    externalId: string;
    type: string;
  }) {
    return this.client.userBinding.create({
      data,
      select: {
        id: true,
        userId: true,
        externalId: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUserBinding(userId: number, type: string) {
    return this.client.userBinding.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });
  }

  async updateUserBinding(userId: number, type: string, externalId: string) {
    return this.client.userBinding.update({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
      data: {
        externalId,
      },
      select: {
        id: true,
        userId: true,
        externalId: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async upsertUserBinding(data: {
    userId: number;
    externalId: string;
    type: string;
  }) {
    return this.client.userBinding.upsert({
      where: {
        userId_type: {
          userId: data.userId,
          type: data.type,
        },
      },
      update: {
        externalId: data.externalId,
      },
      create: data,
      select: {
        id: true,
        userId: true,
        externalId: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserBindings(userId: number) {
    return this.client.userBinding.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        externalId: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async deleteUserBinding(userId: number, type: string) {
    return this.client.userBinding.delete({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });
  }

  // Lucra Webhook operations
  async createLucraWebhook(payload: string) {
    return this.client.lucraWebhook.create({
      data: {
        payload,
      },
    });
  }

  // Lucra Matchup operations
  async createManyLucraMatchups(
    data: Array<{
      matchupId: string;
      groupId: string;
      userId: string;
      numberId?: number;
    }>
  ) {
    return this.client.lucraMatchup.createMany({
      data,
    });
  }

  async deleteLucraMatchupsByMatchupId(matchupId: string) {
    return this.client.lucraMatchup.deleteMany({
      where: {
        matchupId,
      },
    });
  }

  async completeLucraMatchupById(matchupId: string) {
    return this.client.lucraMatchup.updateMany({
      where: {
        matchupId,
      },
      data: {
        completedAt: new Date(),
      },
    });
  }

  async findOldestUncompletedLucraMatchup(lucraUserId: string) {
    return this.client.lucraMatchup.findFirst({
      where: {
        userId: lucraUserId,
        completedAt: null,
        numberId: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  async updateLucraMatchupWithNumber(
    matchupId: string,
    groupId: string,
    lucraUserId: string,
    numberId: number
  ) {
    return this.client.lucraMatchup.update({
      where: {
        matchupId_groupId_userId: {
          matchupId,
          groupId,
          userId: lucraUserId,
        },
      },
      data: {
        numberId,
      },
    });
  }

  async findUserBindingsByType(type: string, externalIds: string[]) {
    return this.client.userBinding.findMany({
      where: {
        type,
        externalId: {
          in: externalIds,
        },
      },
      select: {
        userId: true,
        externalId: true,
      },
    });
  }

  async findUncompletedLucraMatchupRecords(matchupId: string) {
    return this.client.lucraMatchup.findMany({
      where: {
        matchupId,
        completedAt: null,
      },
      include: {
        number: {
          select: {
            value: true,
          },
        },
      },
    });
  }

  // Transaction support
  get transaction() {
    return this.client.$transaction;
  }
}

// Export singleton instance
export const db = new DatabaseService();
