'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <Suspense fallback={<div style={pageStyle}>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
                return;
            }

            // ログイン成功 → 設定画面へ
            router.push('/settings');
        } catch {
            setError('ログイン中にエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>🔐 ログイン</h1>
                <p style={descStyle}>AI営業マネージャーにログイン</p>

                {registered && (
                    <div style={successStyle}>
                        ✅ アカウントが作成されました。ログインしてください。
                    </div>
                )}

                {error && <div style={errorStyle}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="taro@example.com"
                            required
                            style={inputStyle}
                        />
                    </div>

                    <div style={fieldStyle}>
                        <label style={labelStyle}>パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="パスワードを入力"
                            required
                            style={inputStyle}
                        />
                    </div>

                    <button type="submit" disabled={isLoading} style={btnStyle}>
                        {isLoading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <p style={linkTextStyle}>
                    アカウントをお持ちでない方は <Link href="/register" style={linkStyle}>新規登録</Link>
                </p>
            </div>
        </div>
    );
}

const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a1628 100%)',
    padding: '2rem',
};
const cardStyle: React.CSSProperties = {
    background: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(99, 207, 197, 0.15)',
    borderRadius: '1.5rem',
    padding: '2.5rem',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
const titleStyle: React.CSSProperties = { fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' };
const descStyle: React.CSSProperties = { fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem' };
const successStyle: React.CSSProperties = {
    background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    color: '#6ee7b7',
    fontSize: '0.875rem',
    marginBottom: '1rem',
};
const errorStyle: React.CSSProperties = {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    color: '#fca5a5',
    fontSize: '0.875rem',
    marginBottom: '1rem',
};
const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#d1d5db', marginBottom: '0.25rem' };
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #63cfc5, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
};
const linkTextStyle: React.CSSProperties = { textAlign: 'center', marginTop: '1.25rem', color: '#9ca3af', fontSize: '0.85rem' };
const linkStyle: React.CSSProperties = { color: '#63cfc5' };
