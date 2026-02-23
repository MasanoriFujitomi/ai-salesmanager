// アカウント設定ページ
// プロフィール情報編集 + Googleカレンダー連携ON/OFF
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const googleStatus = searchParams.get('google');
    const errorParam = searchParams.get('error');

    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [department, setDepartment] = useState('');
    const [position, setPosition] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // ユーザー情報を取得
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/profile');
            const data = await res.json();
            if (data.user) {
                setName(data.user.name || '');
                setCompany(data.user.company || '');
                setDepartment(data.user.department || '');
                setPosition(data.user.position || '');
                setPhone(data.user.phone || '');
            }
        } catch { /* ignore */ }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, company, department, position, phone }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMessage('✅ プロフィールを更新しました');
            await update({ name });
        } catch (err) {
            setMessage(err instanceof Error ? `❌ ${err.message}` : '❌ 更新に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleConnect = async () => {
        try {
            const res = await fetch('/api/google/auth');
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            setMessage('❌ Google認証URLの取得に失敗しました');
        }
    };

    const handleGoogleDisconnect = async () => {
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calendarEnabled: false }),
            });
            if (res.ok) {
                setMessage('✅ Googleカレンダー連携を解除しました');
                await update({ calendarEnabled: false });
            }
        } catch {
            setMessage('❌ 連携解除に失敗しました');
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <Link href="/" style={backStyle}>← ホームへ</Link>
                <h1 style={titleStyle}>👤 アカウント設定</h1>

                {googleStatus === 'connected' && (
                    <div style={successStyle}>✅ Googleカレンダーが連携されました！</div>
                )}
                {errorParam && (
                    <div style={errorStyle}>❌ Google連携に失敗しました: {errorParam}</div>
                )}
                {message && (
                    <div style={message.startsWith('✅') ? successStyle : errorStyle}>{message}</div>
                )}

                {/* プロフィール編集 */}
                <form onSubmit={handleSave}>
                    <h3 style={sectionStyle}>プロフィール情報</h3>
                    {[
                        { label: '名前', value: name, setter: setName },
                        { label: '会社名', value: company, setter: setCompany },
                        { label: '部署名', value: department, setter: setDepartment },
                        { label: '役職', value: position, setter: setPosition },
                        { label: '携帯電話番号', value: phone, setter: setPhone },
                    ].map((f) => (
                        <div key={f.label} style={fieldStyle}>
                            <label style={labelStyle}>{f.label}</label>
                            <input
                                style={inputStyle}
                                value={f.value}
                                onChange={(e) => f.setter(e.target.value)}
                            />
                        </div>
                    ))}
                    <button type="submit" disabled={isLoading} style={btnStyle}>
                        {isLoading ? '保存中...' : '保存する'}
                    </button>
                </form>

                {/* Googleカレンダー連携 */}
                <div style={{ marginTop: '2rem' }}>
                    <h3 style={sectionStyle}>📅 Googleカレンダー連携</h3>
                    <p style={descStyle}>
                        Googleカレンダーと連携すると、セッション開始時に本日の商談予定が自動表示されます。
                    </p>
                    {session?.user?.calendarEnabled ? (
                        <div>
                            <div style={connectedBadgeStyle}>✅ 連携済み</div>
                            <button onClick={handleGoogleDisconnect} style={disconnectBtnStyle}>
                                連携を解除する
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleGoogleConnect} style={googleBtnStyle}>
                            🔗 Googleアカウントと連携する
                        </button>
                    )}
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
    background: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(99, 207, 197, 0.15)',
    borderRadius: '1.5rem',
    padding: '2.5rem',
    maxWidth: '520px',
    width: '100%',
    marginTop: '2rem',
    height: 'fit-content',
};
const backStyle: React.CSSProperties = { color: '#63cfc5', fontSize: '0.9rem', textDecoration: 'none' };
const titleStyle: React.CSSProperties = { fontSize: '1.5rem', color: '#fff', margin: '0.75rem 0 1.5rem' };
const sectionStyle: React.CSSProperties = { color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' };
const descStyle: React.CSSProperties = { color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.75rem' };
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
const googleBtnStyle: React.CSSProperties = {
    padding: '0.6rem 1.5rem', background: 'rgba(66,133,244,0.2)', border: '1px solid rgba(66,133,244,0.4)',
    borderRadius: '0.75rem', color: '#93c5fd', fontSize: '0.9rem', cursor: 'pointer',
};
const connectedBadgeStyle: React.CSSProperties = {
    display: 'inline-block', padding: '0.4rem 0.75rem', background: 'rgba(16,185,129,0.15)',
    border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', color: '#6ee7b7', fontSize: '0.85rem',
};
const disconnectBtnStyle: React.CSSProperties = {
    marginLeft: '0.75rem', padding: '0.4rem 0.75rem', background: 'none',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#fca5a5',
    fontSize: '0.8rem', cursor: 'pointer',
};
