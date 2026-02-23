// カレンダー表示コンポーネント
// Googleカレンダー連携時: 当日の予定を表示
// 未連携時: フリー入力モード
'use client';

import { useState, useEffect } from 'react';

// カレンダーイベントの型
export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    location: string;
    description: string;
}

// 商談情報の共通データモデル
export interface MeetingContext {
    companyName: string;
    eventTitle: string;
    sourceType: 'calendar' | 'freeInput';
}

interface CalendarViewProps {
    onSelectMeeting: (context: MeetingContext) => void;
}

export default function CalendarView({ onSelectMeeting }: CalendarViewProps) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [connected, setConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // フリー入力モード用
    const [freeCompany, setFreeCompany] = useState('');
    const [freeTitle, setFreeTitle] = useState('');

    useEffect(() => {
        fetchCalendarEvents();
    }, []);

    const fetchCalendarEvents = async () => {
        try {
            const res = await fetch('/api/google/calendar');
            const data = await res.json();
            setEvents(data.events || []);
            setConnected(data.connected || false);
        } catch {
            setConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    // カレンダーイベントから会社名を推定
    const extractCompanyName = (event: CalendarEvent): string => {
        // タイトルや説明から会社名を推定
        const titleMatch = event.title.match(/(.+?)(社|株式会社|㈱|様)/);
        if (titleMatch) return titleMatch[0];
        // 「〇〇 商談」「〇〇 打ち合わせ」パターン
        const meetingMatch = event.title.match(/(.+?)[\s　]+(商談|打ち合わせ|ミーティング|MTG|会議|訪問)/);
        if (meetingMatch) return meetingMatch[1];
        return event.title;
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedId(event.id);
        const companyName = extractCompanyName(event);
        onSelectMeeting({
            companyName,
            eventTitle: event.title,
            sourceType: 'calendar',
        });
    };

    const handleFreeInput = () => {
        if (!freeCompany.trim()) return;
        onSelectMeeting({
            companyName: freeCompany.trim(),
            eventTitle: freeTitle.trim() || `${freeCompany.trim()}との商談`,
            sourceType: 'freeInput',
        });
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return <div style={containerStyle}><p style={loadingStyle}>📅 カレンダーを読み込み中...</p></div>;
    }

    return (
        <div style={containerStyle}>
            <h3 style={sectionTitleStyle}>📅 本日の商談予定</h3>

            {connected && events.length > 0 ? (
                <div style={eventsContainerStyle}>
                    {events.map((event) => (
                        <button
                            key={event.id}
                            onClick={() => handleSelectEvent(event)}
                            style={{
                                ...eventCardStyle,
                                ...(selectedId === event.id ? eventCardSelectedStyle : {}),
                            }}
                        >
                            <div style={eventTimeStyle}>
                                {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
                            <div style={eventTitleStyle}>{event.title}</div>
                            {event.location && (
                                <div style={eventLocationStyle}>📍 {event.location}</div>
                            )}
                        </button>
                    ))}
                </div>
            ) : connected ? (
                <p style={emptyStyle}>本日の予定はありません</p>
            ) : null}

            {/* フリー入力エリア */}
            <div style={freeInputContainerStyle}>
                <p style={freeInputLabelStyle}>
                    {connected ? '予定にない商談の場合:' : 'カレンダー未連携のため、商談情報を入力してください:'}
                </p>
                <input
                    style={inputStyle}
                    type="text"
                    placeholder="会社名を入力"
                    value={freeCompany}
                    onChange={(e) => setFreeCompany(e.target.value)}
                />
                <input
                    style={{ ...inputStyle, marginTop: '0.5rem' }}
                    type="text"
                    placeholder="商談タイトル（任意）"
                    value={freeTitle}
                    onChange={(e) => setFreeTitle(e.target.value)}
                />
                <button
                    style={freeInputBtnStyle}
                    onClick={handleFreeInput}
                    disabled={!freeCompany.trim()}
                >
                    この情報で開始
                </button>
            </div>
        </div>
    );
}

// ---- スタイル ----
const containerStyle: React.CSSProperties = {
    background: 'rgba(17, 24, 39, 0.7)',
    border: '1px solid rgba(99, 207, 197, 0.1)',
    borderRadius: '1rem',
    padding: '1.25rem',
    marginTop: '1.5rem',
};
const sectionTitleStyle: React.CSSProperties = {
    color: '#fff',
    fontSize: '1rem',
    marginBottom: '0.75rem',
};
const loadingStyle: React.CSSProperties = { color: '#9ca3af', textAlign: 'center' };
const emptyStyle: React.CSSProperties = { color: '#9ca3af', fontSize: '0.9rem' };
const eventsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
    maxHeight: '200px',
    overflowY: 'auto',
};
const eventCardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#fff',
    transition: 'all 0.2s',
};
const eventCardSelectedStyle: React.CSSProperties = {
    border: '1px solid #63cfc5',
    background: 'rgba(99, 207, 197, 0.1)',
};
const eventTimeStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#63cfc5', marginBottom: '0.25rem' };
const eventTitleStyle: React.CSSProperties = { fontSize: '0.95rem', fontWeight: 600 };
const eventLocationStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' };
const freeInputContainerStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '0.75rem',
    marginTop: '0.5rem',
};
const freeInputLabelStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
};
const freeInputBtnStyle: React.CSSProperties = {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #63cfc5, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
    width: '100%',
};
