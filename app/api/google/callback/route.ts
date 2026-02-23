// Google OAuthコールバック + トークン保存API
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state'); // ユーザーID

        if (!code || !state) {
            return NextResponse.redirect(new URL('/settings?error=google_auth_failed', req.url));
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            `${baseUrl}/api/google/callback`
        );

        // 認可コードをトークンに交換
        const { tokens } = await oauth2Client.getToken(code);

        // トークンをDBに保存
        await prisma.user.update({
            where: { id: state },
            data: {
                googleAccessToken: tokens.access_token ?? null,
                googleRefreshToken: tokens.refresh_token ?? null,
                googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                calendarEnabled: true,
            },
        });

        return NextResponse.redirect(new URL('/settings?google=connected', req.url));
    } catch (error) {
        console.error('Google callback error:', error);
        return NextResponse.redirect(new URL('/settings?error=google_token_failed', req.url));
    }
}
