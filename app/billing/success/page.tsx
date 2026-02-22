'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function BillingSuccessPage() {
    useEffect(() => {
        // Stripeチェックアウト完了後、Webhookでテナント情報が更新される
        // 少し待ってからbillingページに自動遷移も可能だが、ここでは手動リンクを提供
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1831 100%)',
        }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🎉</div>
            <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #e2e8f0, #63cfc5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '1rem',
            }}>
                ご契約ありがとうございます！
            </h1>
            <p style={{ color: 'rgba(226,232,240,0.6)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '480px' }}>
                決済が完了しました。プランが有効になるまで少々お待ちください。<br />
                ご不明な点は請求メールアドレスまでお問い合わせください。
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/billing" style={{
                    padding: '0.85rem 2rem',
                    background: 'linear-gradient(135deg, #63cfc5, #3b82f6)',
                    color: 'white',
                    fontWeight: 700,
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                }}>
                    請求管理へ →
                </Link>
                <Link href="/session" style={{
                    padding: '0.85rem 2rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(226,232,240,0.8)',
                    fontWeight: 600,
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                }}>
                    セッションを開始する
                </Link>
            </div>
        </div>
    );
}
