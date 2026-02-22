'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PLANS, type Plan } from '@/lib/plans';
import type { Tenant } from '@/lib/tenant-store';
import styles from './page.module.css';

interface Invoice {
    id: string;
    date: string;
    amount: string;
    status: string;
    statusLabel: string;
    pdfUrl: string | null;
    hostedUrl: string | null;
}

type ActiveTab = 'plan' | 'invoices' | 'billing-info';

export default function BillingPage() {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>('plan');
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [billingInfo, setBillingInfo] = useState({
        companyName: '', department: '', contactName: '',
        postalCode: '', address: '', billingEmail: '',
    });
    const [billingInfoSaved, setBillingInfoSaved] = useState(false);

    useEffect(() => {
        fetchTenant();
        fetchInvoices();
    }, []);

    const fetchTenant = async () => {
        try {
            const res = await fetch('/api/stripe/billing-info');
            const data = await res.json();
            setTenant(data.tenant);
            if (data.tenant?.billingInfo) {
                setBillingInfo({ ...billingInfo, ...data.tenant.billingInfo });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/stripe/invoices');
            const data = await res.json();
            setInvoices(data.invoices || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCheckout = useCallback(async (plan: Plan) => {
        setCheckoutLoading(plan.id);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || 'チェックアウトに失敗しました');
            }
        } catch {
            alert('エラーが発生しました');
        } finally {
            setCheckoutLoading(null);
        }
    }, []);

    const handlePortal = async () => {
        const res = await fetch('/api/stripe/portal', { method: 'POST' });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else alert(data.error || 'ポータルアクセスに失敗しました');
    };

    const handleSaveBillingInfo = async () => {
        const res = await fetch('/api/stripe/billing-info', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ billingInfo }),
        });
        if (res.ok) {
            setBillingInfoSaved(true);
            setTimeout(() => setBillingInfoSaved(false), 3000);
        }
    };

    const currentPlan = PLANS.find((p) => p.id === tenant?.planId);
    const isPastDue = tenant?.status === 'past_due' || tenant?.status === 'suspended';

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>読み込み中...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <div className={styles.container}>
                {/* 支払い失敗アラート */}
                {isPastDue && (
                    <div className={styles.alertBanner}>
                        ⚠️ <strong>支払いが失敗しています。</strong>
                        <button className={styles.alertBtn} onClick={handlePortal}>
                            支払い情報を更新する →
                        </button>
                    </div>
                )}

                <div className={styles.header}>
                    <Link href="/" className={styles.backLink}>← ホームへ</Link>
                    <h1 className={styles.title}>💳 請求・プラン管理</h1>

                    {/* 現在のプラン状態 */}
                    <div className={styles.statusCard}>
                        <div>
                            <div className={styles.statusLabel}>現在のプラン</div>
                            <div className={styles.statusValue}>
                                {currentPlan ? currentPlan.name : 'トライアル（無料）'}
                            </div>
                        </div>
                        <div>
                            <div className={styles.statusLabel}>ステータス</div>
                            <div className={`${styles.statusBadge} ${styles[`status_${tenant?.status || 'trial'}`]}`}>
                                {getStatusText(tenant?.status || 'trial')}
                            </div>
                        </div>
                        {tenant?.nextBillingDate && (
                            <div>
                                <div className={styles.statusLabel}>次回請求日</div>
                                <div className={styles.statusValue}>{tenant.nextBillingDate}</div>
                            </div>
                        )}
                        {tenant?.stripeCustomerId && (
                            <button className={styles.portalBtn} onClick={handlePortal}>
                                Stripe管理ポータル →
                            </button>
                        )}
                    </div>
                </div>

                {/* タブ */}
                <div className={styles.tabs}>
                    {(['plan', 'invoices', 'billing-info'] as ActiveTab[]).map((tab) => (
                        <button
                            key={tab}
                            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'plan' ? '📦 プラン選択' : tab === 'invoices' ? '🧾 請求履歴' : '🏢 請求先情報'}
                        </button>
                    ))}
                </div>

                {/* プラン選択 */}
                {activeTab === 'plan' && (
                    <div className={styles.plansGrid}>
                        {PLANS.map((plan) => {
                            const isCurrent = plan.id === tenant?.planId;
                            return (
                                <div
                                    key={plan.id}
                                    className={`${styles.planCard} ${plan.highlighted ? styles.highlighted : ''} ${isCurrent ? styles.current : ''}`}
                                >
                                    {plan.highlighted && <div className={styles.popularBadge}>おすすめ</div>}
                                    {isCurrent && <div className={styles.currentBadge}>現在のプラン</div>}
                                    <div className={styles.planName}>{plan.name}</div>
                                    <div className={styles.planDesc}>{plan.description}</div>
                                    <div className={styles.planPrice}>
                                        <span className={styles.priceNum}>¥{plan.price.toLocaleString('ja-JP')}</span>
                                        <span className={styles.priceUnit}>/月</span>
                                    </div>
                                    <div className={styles.planUsers}>
                                        {plan.maxUsers === null ? 'ユーザー数無制限' : `ユーザー${plan.maxUsers}名まで`}
                                    </div>
                                    <ul className={styles.featureList}>
                                        {plan.features.map((f) => (
                                            <li key={f}><span className={styles.checkMark}>✓</span>{f}</li>
                                        ))}
                                    </ul>
                                    <button
                                        className={`${styles.planBtn} ${isCurrent ? styles.planBtnCurrent : ''}`}
                                        onClick={() => handleCheckout(plan)}
                                        disabled={isCurrent || checkoutLoading === plan.id}
                                    >
                                        {checkoutLoading === plan.id ? '処理中...' : isCurrent ? '契約中' : tenant?.status === 'active' ? 'プランを変更' : '申し込む'}
                                    </button>
                                    {!plan.priceId && (
                                        <div className={styles.priceIdWarning}>
                                            ⚠️ Stripe Price IDが未設定（.env.localを確認）
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 請求履歴 */}
                {activeTab === 'invoices' && (
                    <div className={styles.section}>
                        {invoices.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>請求履歴がありません。</p>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(226,232,240,0.4)' }}>
                                    サブスクリプションを契約すると、ここに請求履歴が表示されます。
                                </p>
                            </div>
                        ) : (
                            <table className={styles.invoiceTable}>
                                <thead>
                                    <tr>
                                        <th>請求日</th>
                                        <th>金額</th>
                                        <th>ステータス</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv) => (
                                        <tr key={inv.id}>
                                            <td>{inv.date}</td>
                                            <td>{inv.amount}</td>
                                            <td>
                                                <span className={`${styles.invStatus} ${styles[`invStatus_${inv.status}`]}`}>
                                                    {inv.statusLabel}
                                                </span>
                                            </td>
                                            <td className={styles.invoiceActions}>
                                                {inv.pdfUrl && (
                                                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                                                        📄 PDF
                                                    </a>
                                                )}
                                                {inv.hostedUrl && (
                                                    <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer" className={styles.invoiceLink}>
                                                        🔗 領収書
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* 請求先情報 */}
                {activeTab === 'billing-info' && (
                    <div className={styles.section}>
                        <div className={styles.billingForm}>
                            {([
                                { key: 'companyName', label: '会社名', placeholder: '株式会社〇〇' },
                                { key: 'department', label: '部署名', placeholder: '営業部' },
                                { key: 'contactName', label: '請求担当者名', placeholder: '山田 太郎' },
                                { key: 'postalCode', label: '郵便番号', placeholder: '123-4567' },
                                { key: 'address', label: '住所', placeholder: '東京都渋谷区...' },
                                { key: 'billingEmail', label: '請求用メールアドレス', placeholder: 'billing@example.com' },
                            ] as { key: keyof typeof billingInfo; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                                <div key={key} className={styles.formGroup}>
                                    <label className={styles.formLabel}>{label}</label>
                                    <input
                                        className={styles.formInput}
                                        type={key === 'billingEmail' ? 'email' : 'text'}
                                        placeholder={placeholder}
                                        value={billingInfo[key]}
                                        onChange={(e) => setBillingInfo({ ...billingInfo, [key]: e.target.value })}
                                    />
                                </div>
                            ))}
                            <button className={styles.saveBtn} onClick={handleSaveBillingInfo}>
                                {billingInfoSaved ? '✓ 保存しました' : '保存する'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusText(status: string): string {
    switch (status) {
        case 'trial': return 'トライアル中';
        case 'active': return '有料契約中';
        case 'past_due': return '⚠️ 支払い遅延';
        case 'suspended': return '🚫 一時停止';
        case 'cancelled': return 'キャンセル済';
        default: return status;
    }
}
