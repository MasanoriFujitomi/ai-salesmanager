// 2FAコード送信API
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generate2FACode, send2FACode } from '@/lib/twilio';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }

        // 6桁コード生成
        const code = generate2FACode();
        const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5分有効

        // DBに保存
        await prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorCode: code,
                twoFactorExpiry: expiry,
            },
        });

        // SMS送信
        const sent = await send2FACode(user.phone, code);
        if (!sent) {
            return NextResponse.json(
                { error: 'SMSの送信に失敗しました。電話番号を確認してください。' },
                { status: 500 }
            );
        }

        // 電話番号の下4桁を返す（UI表示用）
        const maskedPhone = '****' + user.phone.slice(-4);
        return NextResponse.json({ message: '認証コードを送信しました', maskedPhone });
    } catch (error) {
        console.error('2FA send error:', error);
        return NextResponse.json({ error: '認証コードの送信に失敗しました' }, { status: 500 });
    }
}
