'use client';

import Link from 'next/link';

export default function BillingCancelPage() {
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
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>↩️</div>
            <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#e2e8f0',
                marginBottom: '1rem',
            }}>
                お申し込みをキャンセルしました
            </h1>
            <p style={{ color: 'rgba(226,232,240,0.55)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '480px' }}>
                お申し込みはキャンセルされました。カードへの請求は発生していません。<br />
                いつでもプランに申し込むことができます。
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
                    プランを選びなおす →
                </Link>
                <Link href="/" style={{
                    padding: '0.85rem 2rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(226,232,240,0.8)',
                    fontWeight: 600,
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontSize: '1rem',
                }}>
                    ホームへ戻る
                </Link>
            </div>
        </div>
    );
}
