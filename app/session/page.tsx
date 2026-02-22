'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import VoiceInput from '@/components/VoiceInput';
import MeetingSummary from '@/components/MeetingSummary';
import WordRegistry from '@/components/WordRegistry';
import { extractAnalysisFromResponse, type MeetingRecord, type ConversationTurn } from '@/lib/spin-analysis';
import { type HistoryRecord, HISTORY_KEY } from '@/lib/history-store';
import type { CustomWord } from '@/components/VoiceInput';
import styles from './page.module.css';
import '../print.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

const INITIAL_MESSAGE: Message = {
    role: 'assistant',
    content: `こんにちは！ 商談お疲れさまでした。🤝\n\n今日の商談について、詳しく聞かせてください。\n\nまず、今日はどんな会社・担当者の方と商談をされましたか？また、全体的な感触はいかがでしたか？`,
    timestamp: new Date().toISOString(),
};

export default function SessionPage() {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<Partial<MeetingRecord> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // 機能3: 音声読み上げ
    const [isMuted, setIsMuted] = useState(false);
    const isMutedRef = useRef(false);
    useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

    // 機能1: 単語登録モーダル
    const [showWordRegistry, setShowWordRegistry] = useState(false);
    const [customWords, setCustomWords] = useState<CustomWord[]>([]);

    // 機能5: 30秒後送信確認ダイアログ
    const [autoSubmitDialog, setAutoSubmitDialog] = useState<{ text: string } | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 機能3: AIの発言を音声読み上げ
    const speakText = useCallback((text: string) => {
        if (isMutedRef.current) return;
        if (!window.speechSynthesis) return;
        // JSON含むメッセージはスキップ
        if (text.includes('```json')) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }, []);

    const sendMessage = useCallback(async (userText: string) => {
        if (!userText.trim() || isLoading) return;

        // ダイアログが出ていたら閉じる
        setAutoSubmitDialog(null);

        const userMsg: Message = {
            role: 'user',
            content: userText,
            timestamp: new Date().toISOString(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'エラーが発生しました');
            }

            const assistantMsg: Message = {
                role: 'assistant',
                content: data.content,
                timestamp: new Date().toISOString(),
            };

            const finalMessages = [...newMessages, assistantMsg];
            setMessages(finalMessages);

            // 機能3: AI返答を読み上げ
            speakText(data.content);

            // 分析結果を抽出
            const analysis = extractAnalysisFromResponse(data.content);
            if (analysis) {
                const result: Partial<MeetingRecord> = {
                    ...analysis,
                    date: new Date().toLocaleDateString('ja-JP'),
                    conversation: newMessages.map((m) => ({
                        role: m.role,
                        content: m.content,
                        timestamp: m.timestamp,
                    })) as ConversationTurn[],
                };
                setAnalysisResult(result);

                // 商談履歴をlocalStorageに保存
                try {
                    const HISTORY_KEY = 'ai_sales_history';
                    const stored = localStorage.getItem(HISTORY_KEY);
                    const history: HistoryRecord[] = stored ? JSON.parse(stored) : [];
                    const newRecord: HistoryRecord = {
                        id: Date.now().toString(),
                        savedAt: new Date().toISOString(),
                        customerName: analysis.customerName || '（不明）',
                        date: new Date().toLocaleDateString('ja-JP'),
                        messages: [...finalMessages],
                        analysis: result,
                    };
                    history.unshift(newRecord);
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
                } catch { /* ignore */ }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, isLoading, speakText]);

    // 機能5: 30秒後に自動送信確認ダイアログを表示
    const handleAutoSubmitPrompt = useCallback((text: string) => {
        setAutoSubmitDialog({ text });
    }, []);

    return (
        <div className={styles.page}>
            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />

            <header className={styles.header}>
                <Link href="/" className={styles.backLink}>← ホームへ</Link>
                <h1 className={styles.headerTitle}>🤝 AIマネージャー セッション</h1>
                <div className={styles.headerRight}>
                    {/* 機能3: ミュートボタン */}
                    <button
                        className={`${styles.muteBtn} ${isMuted ? styles.muted : ''}`}
                        onClick={() => {
                            const next = !isMuted;
                            setIsMuted(next);
                            if (next) window.speechSynthesis?.cancel();
                        }}
                        title={isMuted ? '音声読み上げON' : '音声読み上げOFF'}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                    {/* 機能1: 単語登録ボタン */}
                    <button
                        className={styles.wordRegBtn}
                        onClick={() => setShowWordRegistry(true)}
                        title="カスタム単語を登録"
                    >
                        📝 単語登録
                    </button>
                    {analysisResult && (
                        <span className={styles.analysisBadge}>✅ 分析完了</span>
                    )}
                </div>
            </header>

            {/* 機能1: 単語登録モーダル */}
            {showWordRegistry && (
                <div className={styles.modalOverlay} onClick={() => setShowWordRegistry(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowWordRegistry(false)}>✕</button>
                        <WordRegistry onChange={setCustomWords} />
                    </div>
                </div>
            )}

            {/* 機能5: 30秒後送信確認ダイアログ */}
            {autoSubmitDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <p className={styles.dialogTitle}>⏱ 入力情報を送信しますか？</p>
                        <div className={styles.dialogPreview}>{autoSubmitDialog.text}</div>
                        <div className={styles.dialogActions}>
                            <button
                                className={styles.dialogYes}
                                onClick={() => {
                                    sendMessage(autoSubmitDialog.text);
                                    setAutoSubmitDialog(null);
                                }}
                            >
                                ✅ はい、送信する
                            </button>
                            <button
                                className={styles.dialogNo}
                                onClick={() => setAutoSubmitDialog(null)}
                            >
                                ✏️ いいえ、追記する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.layout}>
                {/* Chat Panel */}
                <section className={styles.chatPanel}>
                    <div className={styles.messages}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`${styles.message} ${msg.role === 'user' ? styles.user : styles.assistant}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className={styles.avatar}>AI</div>
                                )}
                                <div className={styles.bubble}>
                                    {msg.content.includes('```json') ? (
                                        <div>
                                            <p className={styles.analysisNote}>
                                                ✅ 分析が完了しました！右側のレポートをご確認ください。
                                            </p>
                                            <p>お疲れさまでした。次の商談での活躍を期待しています！</p>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className={`${styles.avatar} ${styles.userAvatar}`}>You</div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className={`${styles.message} ${styles.assistant}`}>
                                <div className={styles.avatar}>AI</div>
                                <div className={styles.bubble}>
                                    <div className={styles.typing}>
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {error && (
                        <div className={styles.errorBanner}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div className={styles.inputArea}>
                        <VoiceInput
                            onTranscript={sendMessage}
                            isLoading={isLoading}
                            customWords={customWords}
                            onAutoSubmitPrompt={handleAutoSubmitPrompt}
                        />
                        <p className={styles.hint}>
                            💡 ヒント: 「ありがとう」「終了」と入力するとAIが分析レポートを生成します
                        </p>
                    </div>
                </section>

                {/* Analysis Panel */}
                <aside className={styles.analysisPanel}>
                    {analysisResult ? (
                        <MeetingSummary record={analysisResult} />
                    ) : (
                        <div className={styles.placeholder}>
                            <div className={styles.placeholderIcon}>📊</div>
                            <h3>分析レポート</h3>
                            <p>セッションを終了すると<br />ここに分析結果が表示されます。</p>
                            <div className={styles.spinTips}>
                                <p className={styles.tipsTitle}>AIは以下を分析します：</p>
                                <ul>
                                    <li>🔵 状況質問 (S) の把握度</li>
                                    <li>🟡 問題質問 (P) の深さ</li>
                                    <li>🔴 示唆質問 (I) の有効性</li>
                                    <li>🟢 解決質問 (N) の成果</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
