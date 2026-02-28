// アカウント登録API
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { email, password, name, company, department, position, phone } = await req.json();

        // バリデーション
        if (!email || !password || !name || !company || !department || !position || !phone) {
            return NextResponse.json(
                { error: 'すべての項目を入力してください' },
                { status: 400 }
            );
        }

        // パスワード強度チェック
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'パスワードは8文字以上で設定してください' },
                { status: 400 }
            );
        }

        // メールアドレス重複チェック
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: 'このメールアドレスは既に登録されています' },
                { status: 409 }
            );
        }

        // パスワードハッシュ化
        const passwordHash = await bcrypt.hash(password, 12);

        // ユーザー作成
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                company,
                department,
                position,
                phone,
            },
        });

        return NextResponse.json({ message: 'アカウントが作成されました' });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            {
                error: 'アカウント作成中にエラーが発生しました',
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
