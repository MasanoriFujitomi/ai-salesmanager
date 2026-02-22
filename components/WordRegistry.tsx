'use client';

import { useState, useEffect } from 'react';
import styles from './WordRegistry.module.css';
import type { CustomWord } from './VoiceInput';

const STORAGE_KEY = 'ai_sales_custom_words';

interface Props {
    onChange: (words: CustomWord[]) => void;
}

export default function WordRegistry({ onChange }: Props) {
    const [words, setWords] = useState<CustomWord[]>([]);
    const [newReading, setNewReading] = useState('');
    const [newWord, setNewWord] = useState('');
    const [error, setError] = useState('');

    // localStorage から読み込み
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as CustomWord[];
                setWords(parsed);
                onChange(parsed);
            }
        } catch { /* ignore */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = (updated: CustomWord[]) => {
        setWords(updated);
        onChange(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const handleAdd = () => {
        if (!newReading.trim() || !newWord.trim()) {
            setError('読み仮名と登録単語の両方を入力してください');
            return;
        }
        if (words.some(w => w.reading === newReading.trim())) {
            setError('同じ読み仮名がすでに登録されています');
            return;
        }
        setError('');
        save([...words, { reading: newReading.trim(), word: newWord.trim() }]);
        setNewReading('');
        setNewWord('');
    };

    const handleDelete = (index: number) => {
        save(words.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>📝 単語登録</h3>
            <p className={styles.desc}>
                音声認識で正しく読み取れない製品名・型番を登録します。<br />
                音声認識後に自動で正しい表記に変換されます。
            </p>

            {/* 入力フォーム */}
            <div className={styles.form}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>音声での読み方<span className={styles.required}>必須</span></label>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="例: えーびーしーにひゃくがた"
                        value={newReading}
                        onChange={(e) => setNewReading(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>正しい表記<span className={styles.required}>必須</span></label>
                    <input
                        className={styles.input}
                        type="text"
                        placeholder="例: ABC-200型"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button className={styles.addBtn} onClick={handleAdd}>
                    ＋ 登録する
                </button>
            </div>

            {/* 登録済みリスト */}
            {words.length > 0 ? (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>音声での読み方</th>
                            <th>変換後の表記</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {words.map((w, i) => (
                            <tr key={i}>
                                <td className={styles.reading}>{w.reading}</td>
                                <td className={styles.wordCell}><strong>{w.word}</strong></td>
                                <td>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(i)}>削除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className={styles.empty}>まだ単語が登録されていません</p>
            )}
        </div>
    );
}
