import { Prisma, PrismaClient, User, QuickBooksConnection } from '@prisma/client';

// Type enhancement for Prisma's findFirst method
export interface PrismaUserClient extends Omit<PrismaClient['user'], 'findFirst'> {
  findFirst(args: Prisma.UserFindFirstArgs): Promise<User | null>;
}

export interface PrismaQuickBooksConnectionClient extends Omit<PrismaClient['quickBooksConnection'], 'findFirst'> {
  findFirst(args: Prisma.QuickBooksConnectionFindFirstArgs): Promise<QuickBooksConnection | null>;
}

// You can add more type enhancements here as needed 