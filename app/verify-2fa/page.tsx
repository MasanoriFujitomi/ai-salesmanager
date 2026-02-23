'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Verify2FAPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    // ページ表示時に自動で2FAコード送信
    useEffect(() => {
        send2FACode();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const send2FACode = async () => {
        setIsSending(true);
        setError('');
        try {
            const res = await fetch('/api/auth/send-2fa', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMaskedPhone(data.maskedPhone);
            setSent(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : '送信に失敗しました');
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            // セッションの2FA状態を更新
            await update({ twoFactorVerified: true });

            // ホームへリダイレクト
            router.push('/');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : '検証に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>📱 2段階認証</h1>
                <p style={descStyle}>
                    {maskedPhone
                        ? `${maskedPhone} に6桁の認証コードを送信しました`
                        : 'ログインされた電話番号に認証コードを送信します'}
                </p>

                {error && <div style={errorStyle}>{error}</div>}

                {sent && (
                    <form onSubmit={handleVerify}>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>認証コード（6桁）</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="123456"
                                required
                                style={{ ...inputStyle, fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5em' }}
                                autoFocus
                            />
                        </div>
                        <button type="submit" disabled={isLoading || code.length !== 6} style={btnStyle}>
                            {isLoading ? '検証中...' : '認証する'}
                        </button>
                    </form>
                )}

                <button
                    onClick={send2FACode}
                    disabled={isSending}
                    style={resendStyle}
                >
                    {isSending ? '送信中...' : '🔄 コードを再送信'}
                </button>
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
    textAlign: 'center',
};
const titleStyle: React.CSSProperties = { fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' };
const descStyle: React.CSSProperties = { fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem' };
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
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#d1d5db', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#fff',
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
};
const resendStyle: React.CSSProperties = {
    marginTop: '1.25rem',
    background: 'none',
    border: 'none',
    color: '#63cfc5',
    cursor: 'pointer',
    fontSize: '0.9rem',
};
