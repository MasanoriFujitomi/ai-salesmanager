// 認証ミドルウェア
// 未ログインユーザーを/loginにリダイレクト
// 2FA未検証ユーザーを/verify-2faにリダイレクト

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // 2FA未検証の場合、/verify-2fa以外へのアクセスをブロック
        if (token && !token.twoFactorVerified && pathname !== '/verify-2fa') {
            return NextResponse.redirect(new URL('/verify-2fa', req.url));
        }

        // 2FA検証済みで/verify-2faにアクセスした場合はホームへ
        if (token && token.twoFactorVerified && pathname === '/verify-2fa') {
            return NextResponse.redirect(new URL('/', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

// 認証が必要なルートを指定
// /login, /register, /api/auth, /_next, /favicon.ico は除外
export const config = {
    matcher: [
        '/',
        '/session/:path*',
        '/history/:path*',
        '/billing/:path*',
        '/settings/:path*',
        '/verify-2fa',
        '/api/chat/:path*',
        '/api/stripe/:path*',
        '/api/google/:path*',
    ],
};
