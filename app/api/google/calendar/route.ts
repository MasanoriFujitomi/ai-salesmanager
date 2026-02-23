// 当日のGoogleカレンダーイベント取得API
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true,
                calendarEnabled: true,
            },
        });

        if (!user?.calendarEnabled || !user.googleAccessToken) {
            return NextResponse.json({ events: [], connected: false });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, `${baseUrl}/api/google/callback`);
        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
            expiry_date: user.googleTokenExpiry?.getTime(),
        });

        // トークンリフレッシュ
        if (user.googleTokenExpiry && new Date() > user.googleTokenExpiry) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        googleAccessToken: credentials.access_token ?? undefined,
                        googleRefreshToken: credentials.refresh_token ?? undefined,
                        googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
                    },
                });
                oauth2Client.setCredentials(credentials);
            } catch {
                return NextResponse.json({ events: [], connected: false, error: 'トークンのリフレッシュに失敗しました' });
            }
        }

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // 当日の開始と終了
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = (res.data.items || []).map((event) => ({
            id: event.id,
            title: event.summary || '（タイトルなし）',
            start: event.start?.dateTime || event.start?.date || '',
            end: event.end?.dateTime || event.end?.date || '',
            location: event.location || '',
            description: event.description || '',
        }));

        return NextResponse.json({ events, connected: true });
    } catch (error) {
        console.error('Calendar fetch error:', error);
        return NextResponse.json({ events: [], connected: false, error: 'カレンダー取得に失敗しました' });
    }
}
