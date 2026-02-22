'use client';

import styles from './MeetingSummary.module.css';
import type { MeetingRecord } from '@/lib/spin-analysis';

interface Props {
    record: Partial<MeetingRecord>;
}

const SPIN_LABELS: Record<string, { label: string; color: string }> = {
    situation: { label: 'S: 状況質問', color: '#63cfc5' },
    problem: { label: 'P: 問題質問', color: '#f59e0b' },
    implication: { label: 'I: 示唆質問', color: '#ef4444' },
    needPayoff: { label: 'N: 解決質問', color: '#10b981' },
};

export default function MeetingSummary({ record }: Props) {
    const score = record.score;
    const spin = record.spinAnalysis;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={styles.container} id="report-print-area">
            <div className={styles.headerRow}>
                <h2 className={styles.title}>📊 商談分析レポート</h2>
                <button className={styles.printBtn} onClick={handlePrint} title="レポートを印刷・PDF保存">
                    🖨️ 印刷/保存
                </button>
            </div>

            {record.customerName && (
                <p className={styles.meta}>
                    顧客: <strong>{record.customerName}</strong> /{' '}
                    {record.date}
                </p>
            )}

            {record.summary && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>💬 商談サマリー（議事録）</h3>
                    <p className={styles.text}>{record.summary}</p>
                </div>
            )}

            {score && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>🎯 SPINスコア</h3>
                    <div className={styles.scores}>
                        {(Object.entries(SPIN_LABELS) as [keyof typeof SPIN_LABELS, { label: string; color: string }][]).map(
                            ([key, { label, color }]) => {
                                const val = score[key as keyof typeof score] as number;
                                return (
                                    <div key={key} className={styles.scoreRow}>
                                        <span className={styles.scoreLabel} style={{ color }}>
                                            {label}
                                        </span>
                                        <div className={styles.barBg}>
                                            <div
                                                className={styles.barFill}
                                                style={{ width: `${val}%`, background: color }}
                                            />
                                        </div>
                                        <span className={styles.scoreVal}>{val}</span>
                                    </div>
                                );
                            }
                        )}
                        <div className={styles.overall}>
                            総合スコア: <strong>{score.overall} / 100</strong>
                        </div>
                    </div>
                </div>
            )}

            {spin && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>🔍 SPIN詳細分析</h3>
                    {(Object.entries(SPIN_LABELS) as [keyof typeof SPIN_LABELS, { label: string; color: string }][]).map(
                        ([key, { label, color }]) => {
                            const items = spin[key as keyof typeof spin] as string[];
                            if (!items || items.length === 0) return null;
                            return (
                                <div key={key} className={styles.spinSection}>
                                    <h4 style={{ color }}>{label}</h4>
                                    <ul>
                                        {items.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        }
                    )}
                </div>
            )}

            {record.strengths && record.strengths.length > 0 && (
                <div className={`${styles.card} ${styles.strengthCard}`}>
                    <h3 className={styles.cardTitle}>✅ 良かった点</h3>
                    <ul>
                        {record.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {record.improvements && record.improvements.length > 0 && (
                <div className={`${styles.card} ${styles.improvementCard}`}>
                    <h3 className={styles.cardTitle}>📈 改善ポイント</h3>
                    <ul>
                        {record.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </div>
            )}

            {record.actionPlan && record.actionPlan.length > 0 && (
                <div className={`${styles.card} ${styles.actionCard}`}>
                    <h3 className={styles.cardTitle}>🚀 次回アクションプラン</h3>
                    <ol>
                        {record.actionPlan.map((a, i) => (
                            <li key={i}>{a}</li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}
