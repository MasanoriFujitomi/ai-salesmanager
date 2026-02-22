'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { loadHistory, deleteHistoryRecord, type HistoryRecord } from '@/lib/history-store';
import styles from './page.module.css';

// Word(.docx)生成のため動的インポート
async function generateDocx(record: HistoryRecord): Promise<void> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

    const analysis = record.analysis;
    const spin = analysis.spinAnalysis;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [
        new Paragraph({
            text: '商談レポート',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        new Paragraph({ children: [new TextRun({ text: `日付: ${record.date}`, bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: `顧客名: ${record.customerName}`, bold: true })] }),
        new Paragraph({ text: '' }),
    ];

    // 基本情報
    if (analysis.customerName || analysis.summary) {
        children.push(new Paragraph({ text: '【基本情報】', heading: HeadingLevel.HEADING_2 }));
        if (analysis.customerName) children.push(new Paragraph({ text: `担当者: ${analysis.customerName}` }));
        if (analysis.summary) children.push(new Paragraph({ text: `要約: ${analysis.summary}` }));
        children.push(new Paragraph({ text: '' }));
    }

    // SPIN分析
    const spinItems = [
        { label: 'S（状況）', value: spin?.situation },
        { label: 'P（問題）', value: spin?.problem },
        { label: 'I（示唆）', value: spin?.implication },
        { label: 'N（解決）', value: spin?.needPayoff },
    ];
    children.push(new Paragraph({ text: '【SPIN分析】', heading: HeadingLevel.HEADING_2 }));
    for (const item of spinItems) {
        const val = Array.isArray(item.value) ? item.value.join('、') : String(item.value || '');
        if (val) {
            children.push(new Paragraph({ children: [new TextRun({ text: `${item.label}: `, bold: true }), new TextRun(val)] }));
        }
    }
    children.push(new Paragraph({ text: '' }));

    // アクションプラン
    if (analysis.actionPlan && (analysis.actionPlan as string[]).length > 0) {
        children.push(new Paragraph({ text: '【アクションプラン】', heading: HeadingLevel.HEADING_2 }));
        for (const action of (analysis.actionPlan as string[])) {
            children.push(new Paragraph({ text: `・${action}` }));
        }
        children.push(new Paragraph({ text: '' }));
    }

    // 議事録（チャット履歴）
    children.push(new Paragraph({ text: '【商談議事録】', heading: HeadingLevel.HEADING_2 }));
    for (const msg of record.messages) {
        const roleLabel = msg.role === 'user' ? '営業担当' : 'AIマネージャー';
        children.push(new Paragraph({
            children: [
                new TextRun({ text: `[${roleLabel}] `, bold: true }),
                new TextRun(msg.content),
            ],
        }));
        children.push(new Paragraph({ text: '' }));
    }

    const doc = new Document({
        sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `商談レポート_${record.customerName}_${record.date}.docx`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function HistoryPage() {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [selected, setSelected] = useState<HistoryRecord | null>(null);
    const [generatingWord, setGeneratingWord] = useState<string | null>(null);

    useEffect(() => {
        setRecords(loadHistory());
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (!confirm('この商談履歴を削除しますか？')) return;
        const updated = deleteHistoryRecord(id);
        setRecords(updated);
        if (selected?.id === id) setSelected(null);
    }, [selected]);

    const handleWordDownload = useCallback(async (record: HistoryRecord) => {
        setGeneratingWord(record.id);
        try {
            await generateDocx(record);
        } catch (e) {
            console.error(e);
            alert('Word生成に失敗しました');
        } finally {
            setGeneratingWord(null);
        }
    }, []);

    const handlePrint = useCallback((record: HistoryRecord) => {
        setSelected(record);
        setTimeout(() => window.print(), 300);
    }, []);

    return (
        <div className={styles.page}>
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/" className={styles.backLink}>← ホームへ</Link>
                    <h1 className={styles.title}>📋 商談履歴</h1>
                    <p className={styles.subtitle}>過去の商談セッションと分析レポートの一覧</p>
                </div>

                {records.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📭</div>
                        <p>まだ商談履歴がありません。</p>
                        <p>セッションを完了して「ありがとう」または「終了」と入力すると、レポートがここに保存されます。</p>
                        <Link href="/session" className={styles.startBtn}>セッションを開始する →</Link>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {records.map((record) => (
                            <div key={record.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.customerName}>{record.customerName}</div>
                                        <div className={styles.dateStr}>{record.date}</div>
                                    </div>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(record.id)} title="削除">🗑</button>
                                </div>
                                {record.analysis?.summary && (
                                    <div className={styles.impression}>{String(record.analysis.summary).slice(0, 80)}...</div>
                                )}
                                <div className={styles.cardActions}>
                                    <button className={styles.viewBtn} onClick={() => setSelected(record)}>📖 詳細を見る</button>
                                    <button
                                        className={styles.wordBtn}
                                        onClick={() => handleWordDownload(record)}
                                        disabled={generatingWord === record.id}
                                    >
                                        {generatingWord === record.id ? '生成中…' : '📄 Word保存'}
                                    </button>
                                    <button className={styles.printBtn} onClick={() => handlePrint(record)}>🖨 印刷/PDF</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 詳細モーダル */}
            {selected && (
                <div className={styles.overlay} onClick={() => setSelected(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()} id="history-print-area">
                        <div className={styles.modalHeader}>
                            <div>
                                <h2 className={styles.modalTitle}>{selected.customerName}</h2>
                                <div className={styles.modalDate}>{selected.date}</div>
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.wordBtn}
                                    onClick={() => handleWordDownload(selected)}
                                    disabled={generatingWord === selected.id}
                                >
                                    {generatingWord === selected.id ? '生成中…' : '📄 Word保存'}
                                </button>
                                <button className={styles.printBtn} onClick={() => window.print()}>🖨 印刷/PDF</button>
                                <button className={styles.closeBtn} onClick={() => setSelected(null)}>✕</button>
                            </div>
                        </div>

                        {/* SPIN分析サマリー */}
                        <div className={styles.analysisSection}>
                            <h3>🔍 SPIN分析</h3>
                            <div className={styles.spinGrid}>
                                {[
                                    { key: 'S', label: '状況', value: selected.analysis?.spinAnalysis?.situation, color: '#63cfc5' },
                                    { key: 'P', label: '問題', value: selected.analysis?.spinAnalysis?.problem, color: '#f59e0b' },
                                    { key: 'I', label: '示唆', value: selected.analysis?.spinAnalysis?.implication, color: '#ef4444' },
                                    { key: 'N', label: '解決', value: selected.analysis?.spinAnalysis?.needPayoff, color: '#10b981' },
                                ].map((item) => (
                                    <div key={item.key} className={styles.spinCard} style={{ borderColor: item.color + '40' }}>
                                        <div className={styles.spinKey} style={{ color: item.color }}>{item.key}</div>
                                        <div className={styles.spinLabel}>{item.label}</div>
                                        <div className={styles.spinValue}>
                                            {Array.isArray(item.value) ? item.value.join('、') : String(item.value || '—')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* アクションプラン */}
                        {selected.analysis?.actionPlan && (selected.analysis.actionPlan as string[]).length > 0 && (
                            <div className={styles.analysisSection}>
                                <h3>📋 アクションプラン</h3>
                                <ul className={styles.actionList}>
                                    {(selected.analysis.actionPlan as string[]).map((action, i) => (
                                        <li key={i}>{action}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* チャット履歴 */}
                        <div className={styles.analysisSection}>
                            <h3>💬 商談会話ログ</h3>
                            <div className={styles.chatLog}>
                                {selected.messages.map((msg, i) => (
                                    <div key={i} className={`${styles.chatMsg} ${msg.role === 'user' ? styles.userMsg : styles.aiMsg}`}>
                                        <span className={styles.msgRole}>{msg.role === 'user' ? '👤 営業担当' : '🤖 AIマネージャー'}</span>
                                        <div className={styles.msgContent}>{msg.content}</div>
                                        {msg.timestamp && <div className={styles.msgTime}>{msg.timestamp}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
