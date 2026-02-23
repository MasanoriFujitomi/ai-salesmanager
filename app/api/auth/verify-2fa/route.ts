// 2FAコード検証API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ error: '認証コードを入力してください' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.twoFactorCode || !user.twoFactorExpiry) {
            return NextResponse.json({ error: '認証コードが見つかりません。再送信してください。' }, { status: 400 });
        }

        // 有効期限チェック
        if (new Date() > user.twoFactorExpiry) {
            return NextResponse.json({ error: '認証コードの有効期限が切れました。再送信してください。' }, { status: 400 });
        }

        // コード検証
        if (user.twoFactorCode !== code) {
            return NextResponse.json({ error: '認証コードが正しくありません' }, { status: 400 });
        }

        // 2FA検証済みに更新
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: null,
                twoFactorExpiry: null,
                twoFactorVerified: true,
            },
        });

        return NextResponse.json({ message: '2段階認証が完了しました' });
    } catch (error) {
        console.error('2FA verify error:', error);
        return NextResponse.json({ error: '認証コードの検証に失敗しました' }, { status: 500 });
    }
}
