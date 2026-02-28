// Prismaクライアント初期化
// 開発時のホットリロードでインスタンスが増殖するのを防ぐ

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
    const connectionString = process.env.DATABASE_URL;

    // Vercel Serverless環境向けにPoolの設定を最適化
    const pool = new Pool({
        connectionString,
        max: process.env.DATABASE_POOL_MAX ? parseInt(process.env.DATABASE_POOL_MAX) : 5, // 関数の同時実行数に対して調整可能に
        idleTimeoutMillis: 30000,       // 30秒アイドルでコネクション解放
        connectionTimeoutMillis: 10000, // 10秒で接続タイムアウト
    });

    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'production'
            ? ['error', 'warn']
            : ['query', 'info', 'warn', 'error'],
    });
};

export const prisma =
    globalForPrisma.prisma ??
    createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
