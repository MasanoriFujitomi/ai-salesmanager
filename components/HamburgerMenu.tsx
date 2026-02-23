// ハンバーガーメニューコンポーネント
// 右上に配置。アカウント設定・セキュリティ設定・ログアウトの導線を提供
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function HamburgerMenu() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // メニュー外クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!session) return null;

    return (
        <div ref={menuRef} style={wrapperStyle}>
            {/* ハンバーガーアイコン */}
            <button onClick={() => setIsOpen(!isOpen)} style={iconBtnStyle} aria-label="メニュー">
                <span style={barStyle} />
                <span style={barStyle} />
                <span style={barStyle} />
            </button>

            {/* ドロワーメニュー */}
            {isOpen && (
                <div style={menuStyle}>
                    <div style={userInfoStyle}>
                        <div style={userNameStyle}>{session.user.name}</div>
                        <div style={userEmailStyle}>{session.user.email}</div>
                    </div>

                    <div style={dividerStyle} />

                    <Link href="/settings" style={menuItemStyle} onClick={() => setIsOpen(false)}>
                        👤 アカウント設定
                    </Link>
                    <Link href="/settings/security" style={menuItemStyle} onClick={() => setIsOpen(false)}>
                        🔒 セキュリティ設定
                    </Link>

                    <div style={dividerStyle} />

                    <Link href="/billing" style={menuItemStyle} onClick={() => setIsOpen(false)}>
                        💳 請求・プラン管理
                    </Link>
                    <Link href="/history" style={menuItemStyle} onClick={() => setIsOpen(false)}>
                        📋 商談履歴
                    </Link>

                    <div style={dividerStyle} />

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        style={logoutStyle}
                    >
                        🚪 ログアウト
                    </button>
                </div>
            )}
        </div>
    );
}

const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 1000,
};
const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    background: 'rgba(17, 24, 39, 0.85)',
    border: '1px solid rgba(99, 207, 197, 0.2)',
    borderRadius: '0.5rem',
    padding: '0.6rem 0.5rem',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
};
const barStyle: React.CSSProperties = {
    width: '22px',
    height: '2px',
    background: '#63cfc5',
    borderRadius: '2px',
};
const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 0.5rem)',
    right: 0,
    background: 'rgba(17, 24, 39, 0.98)',
    border: '1px solid rgba(99, 207, 197, 0.15)',
    borderRadius: '1rem',
    padding: '0.75rem 0',
    minWidth: '240px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
};
const userInfoStyle: React.CSSProperties = {
    padding: '0.5rem 1.25rem 0.75rem',
};
const userNameStyle: React.CSSProperties = {
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
};
const userEmailStyle: React.CSSProperties = {
    color: '#9ca3af',
    fontSize: '0.8rem',
    marginTop: '0.15rem',
};
const dividerStyle: React.CSSProperties = {
    height: '1px',
    background: 'rgba(255,255,255,0.06)',
    margin: '0.25rem 0',
};
const menuItemStyle: React.CSSProperties = {
    display: 'block',
    padding: '0.6rem 1.25rem',
    color: '#d1d5db',
    textDecoration: 'none',
    fontSize: '0.9rem',
    transition: 'background 0.15s',
};
const logoutStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.6rem 1.25rem',
    color: '#fca5a5',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: '0.9rem',
    cursor: 'pointer',
};
