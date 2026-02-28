// 認証ミドルウェア
// 未ログインユーザーを/loginにリダイレクト

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function proxy(req) {
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
    '/api/chat/:path*',
    '/api/stripe/:path*',
    '/api/google/:path*',
  ],
};
