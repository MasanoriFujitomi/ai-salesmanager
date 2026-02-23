// パスワード変更API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: '現在のパスワードと新しいパスワードを入力してください' }, { status: 400 });
        }
        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'パスワードは8文字以上で設定してください' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });
        if (!user) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        return NextResponse.json({ message: 'パスワードを変更しました' });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: 'パスワード変更に失敗しました' }, { status: 500 });
    }
}
