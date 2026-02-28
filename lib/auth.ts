// NextAuth.js 設定
// Credentials Provider (email + password) + 2FA状態管理

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

// NextAuthのSession/JWT型を拡張
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            company: string;
            calendarEnabled: boolean;
        };
    }
    interface User {
        id: string;
        company: string;
        calendarEnabled: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        company: string;
        calendarEnabled: boolean;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'メールアドレス', type: 'email' },
                password: { label: 'パスワード', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('メールアドレスとパスワードを入力してください');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error('アカウントが見つかりません');
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) {
                    throw new Error('パスワードが正しくありません');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    company: user.company,
                    calendarEnabled: user.calendarEnabled,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
        newUser: '/register',
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.company = user.company;
                token.calendarEnabled = user.calendarEnabled;
            }
            // セッション更新時
            if (trigger === 'update' && session) {
                if (typeof session.calendarEnabled === 'boolean') {
                    token.calendarEnabled = session.calendarEnabled;
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                id: token.id,
                email: token.email ?? '',
                name: token.name ?? '',
                company: token.company,
                calendarEnabled: token.calendarEnabled,
            };
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
