// セキュリティ設定ページ
// パスワード変更・2段階認証設定
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SecuritySettingsPage() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (newPassword !== confirmPassword) {
            setMessage('❌ 新しいパスワードが一致しません');
            return;
        }
        if (newPassword.length < 8) {
            setMessage('❌ パスワードは8文字以上で設定してください');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage('✅ パスワードを変更しました');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setMessage(err instanceof Error ? `❌ ${err.message}` : '❌ 変更に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <Link href="/settings" style={backStyle}>← アカウント設定へ</Link>
                <h1 style={titleStyle}>🔒 セキュリティ設定</h1>

                {message && (
                    <div style={message.startsWith('✅') ? successStyle : errorStyle}>{message}</div>
                )}

                {/* パスワード変更 */}
                <form onSubmit={handleChangePassword}>
                    <h3 style={sectionStyle}>パスワード変更</h3>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>現在のパスワード</label>
                        <input type="password" style={inputStyle} value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)} required />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>新しいパスワード（8文字以上）</label>
                        <input type="password" style={inputStyle} value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle}>新しいパスワード（確認）</label>
                        <input type="password" style={inputStyle} value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <button type="submit" disabled={isLoading} style={btnStyle}>
                        {isLoading ? '変更中...' : 'パスワードを変更する'}
                    </button>
                </form>

                {/* 2段階認証 */}
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={sectionStyle}>📱 2段階認証</h3>
                    <p style={descStyle}>
                        2段階認証はデフォルトで有効です。<br />
                        ログイン時に登録した携帯電話番号にSMSで認証コードが送信されます。
                    </p>
                    <div style={enabledBadgeStyle}>✅ 有効</div>
                </div>
            </div>
        </div>
    );
}

const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a1628 100%)',
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
};
const cardStyle: React.CSSProperties = {
    background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(99, 207, 197, 0.15)',
    borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '480px', width: '100%',
    marginTop: '2rem', height: 'fit-content',
};
const backStyle: React.CSSProperties = { color: '#63cfc5', fontSize: '0.9rem', textDecoration: 'none' };
const titleStyle: React.CSSProperties = { fontSize: '1.5rem', color: '#fff', margin: '0.75rem 0 1.5rem' };
const sectionStyle: React.CSSProperties = { color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' };
const descStyle: React.CSSProperties = { color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.75rem', lineHeight: 1.6 };
const successStyle: React.CSSProperties = {
    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#6ee7b7', fontSize: '0.875rem', marginBottom: '1rem',
};
const errorStyle: React.CSSProperties = {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '0.75rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '1rem',
};
const fieldStyle: React.CSSProperties = { marginBottom: '0.75rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#d1d5db', marginBottom: '0.25rem' };
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem', background: 'linear-gradient(135deg, #63cfc5, #3b82f6)',
    color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
};
const enabledBadgeStyle: React.CSSProperties = {
    display: 'inline-block', padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', color: '#6ee7b7', fontSize: '0.85rem',
};
