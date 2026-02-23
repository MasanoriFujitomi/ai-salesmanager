// Prisma 7 設定ファイル
// DATABASE_URL環境変数からPostgreSQL接続を構成
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: path.join(__dirname, 'prisma', 'schema.prisma'),
    datasource: {
        url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/ai_sales_manager',
    },
});
