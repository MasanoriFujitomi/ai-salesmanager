// Google OAuth認可URL生成API
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        if (!clientId || !clientSecret) {
            return NextResponse.json(
                { error: 'Google OAuth設定が未完了です（環境変数を確認してください）' },
                { status: 500 }
            );
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            `${baseUrl}/api/google/callback`
        );

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.readonly'],
            prompt: 'consent',
            state: session.user.id, // ユーザーIDをstateに埋め込む
        });

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error('Google auth error:', error);
        return NextResponse.json({ error: 'Google認証URLの生成に失敗しました' }, { status: 500 });
    }
}
