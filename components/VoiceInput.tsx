'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './VoiceInput.module.css';

export interface CustomWord {
    reading: string; // 読み仮名（音声認識で出てくる表記）
    word: string;    // 正しい表記（製品名・型番など）
}

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    isLoading: boolean;
    customWords?: CustomWord[];
    onAutoSubmitPrompt?: (text: string) => void; // 30秒後に呼び出されるコールバック
}

// カスタム単語で置換補正する
function applyCustomWords(text: string, customWords: CustomWord[]): string {
    let result = text;
    for (const { reading, word } of customWords) {
        if (!reading || !word) continue;
        // 大文字小文字・ひらがな/カタカナを考慮した簡易置換
        result = result.replaceAll(reading, word);
    }
    return result;
}

export default function VoiceInput({ onTranscript, isLoading, customWords = [], onAutoSubmitPrompt }: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);

    // 機能4: 確定テキストを蓄積するRef（onresultのたびにリセットしない）
    const accumulatedFinalRef = useRef<string>('');
    // 機能5: 30秒タイマー
    const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // カスタム単語の最新値をRefで保持
    const customWordsRef = useRef<CustomWord[]>(customWords);
    useEffect(() => { customWordsRef.current = customWords; }, [customWords]);

    // 30秒タイマーをリセット・起動
    const resetAutoSubmitTimer = useCallback((currentText: string) => {
        if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

        if (!currentText.trim()) {
            setAutoSubmitCountdown(null);
            return;
        }

        // カウントダウン表示
        setAutoSubmitCountdown(30);
        countdownIntervalRef.current = setInterval(() => {
            setAutoSubmitCountdown((prev) => {
                if (prev === null || prev <= 1) {
                    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        autoSubmitTimerRef.current = setTimeout(() => {
            setAutoSubmitCountdown(null);
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            if (onAutoSubmitPrompt) {
                onAutoSubmitPrompt(accumulatedFinalRef.current);
            }
        }, 30000);
    }, [onAutoSubmitPrompt]);

    // タイマーをキャンセル
    const cancelAutoSubmitTimer = useCallback(() => {
        if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setAutoSubmitCountdown(null);
    }, []);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);

        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ja-JP';
            recognition.continuous = true;
            recognition.interimResults = true;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                let newFinalText = '';
                let interimText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        // 確定テキストを補正してから追記
                        const corrected = applyCustomWords(event.results[i][0].transcript, customWordsRef.current);
                        newFinalText += corrected;
                    } else {
                        interimText += event.results[i][0].transcript;
                    }
                }

                // 機能4: 確定テキストを蓄積（上書きではなく追記）
                if (newFinalText) {
                    accumulatedFinalRef.current += newFinalText;
                    // 機能5: 確定テキストが追加されたらタイマーをリセット
                    resetAutoSubmitTimer(accumulatedFinalRef.current);
                }

                const displayText = accumulatedFinalRef.current + interimText;
                setTranscript(displayText);
            };

            recognition.onend = () => {
                // continuous=trueでも端末によっては止まることがある → 自動再起動
                if (isListeningRef.current) {
                    try { recognition.start(); } catch { /* ignore */ }
                } else {
                    setIsListening(false);
                    stopVisualizer();
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            stopVisualizer();
            cancelAutoSubmitTimer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // isListeningをRefでも保持（onend クロージャ内で参照するため）
    const isListeningRef = useRef(false);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

    const drawVisualizer = () => {
        const canvas = canvasRef.current;
        const analyser = analyserRef.current;
        if (!canvas || !analyser) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(99, 207, 197, 0.9)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        draw();
    };

    const startVisualizer = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStreamRef.current = stream;
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            drawVisualizer();
        } catch {
            console.warn('マイクアクセスが拒否されました');
        }
    };

    const stopVisualizer = () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach((t) => t.stop());
            micStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            // 停止：蓄積テキストはそのまま残す（追記モード）
            recognitionRef.current.stop();
            stopVisualizer();
            setIsListening(false);
        } else {
            // 開始：蓄積をリセットして新規録音
            accumulatedFinalRef.current = '';
            setTranscript('');
            cancelAutoSubmitTimer();
            recognitionRef.current.start();
            startVisualizer();
            setIsListening(true);
        }
    };

    const handleSubmit = useCallback(() => {
        const text = transcript.trim();
        if (text) {
            cancelAutoSubmitTimer();
            onTranscript(text);
            // 送信後リセット
            accumulatedFinalRef.current = '';
            setTranscript('');
            if (isListening) {
                recognitionRef.current?.stop();
                stopVisualizer();
                setIsListening(false);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transcript, isListening, onTranscript, cancelAutoSubmitTimer]);

    if (!isSupported) {
        return (
            <div className={styles.unsupported}>
                ⚠️ このブラウザは音声認識に対応していません。Chrome をお使いください。
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <canvas ref={canvasRef} className={styles.canvas} width={500} height={60} />

            {/* 30秒カウントダウン表示 */}
            {autoSubmitCountdown !== null && (
                <div className={styles.countdownBar}>
                    <span className={styles.countdownIcon}>⏱</span>
                    <span>{autoSubmitCountdown}秒後に送信確認します</span>
                    <button className={styles.countdownCancel} onClick={cancelAutoSubmitTimer}>
                        キャンセル
                    </button>
                </div>
            )}

            <div className={styles.inputRow}>
                <textarea
                    className={styles.textarea}
                    value={transcript}
                    onChange={(e) => {
                        setTranscript(e.target.value);
                        accumulatedFinalRef.current = e.target.value;
                    }}
                    placeholder={isListening ? '🎙 話しかけてください... (間が空いても追記されます)' : 'ここにテキストを入力するか、マイクボタンを押して話しかけてください'}
                    rows={3}
                />
                <div className={styles.buttons}>
                    <button
                        className={`${styles.micBtn} ${isListening ? styles.active : ''}`}
                        onClick={toggleListening}
                        title={isListening ? '停止（テキストは残ります）' : '音声入力開始'}
                    >
                        {isListening ? '⏹' : '🎙'}
                    </button>
                    <button
                        className={styles.sendBtn}
                        onClick={handleSubmit}
                        disabled={!transcript.trim() || isLoading}
                    >
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
}
