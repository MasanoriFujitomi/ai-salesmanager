import type { MeetingRecord } from './spin-analysis';

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface HistoryRecord {
    id: string;
    savedAt: string;
    customerName: string;
    date: string;
    messages: HistoryMessage[];
    analysis: Partial<MeetingRecord>;
}

export const HISTORY_KEY = 'ai_sales_history';

export function loadHistory(): HistoryRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

export function saveHistory(records: HistoryRecord[]): void {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, 50)));
    } catch { /* ignore */ }
}

export function deleteHistoryRecord(id: string): HistoryRecord[] {
    const current = loadHistory();
    const updated = current.filter((r) => r.id !== id);
    saveHistory(updated);
    return updated;
}
