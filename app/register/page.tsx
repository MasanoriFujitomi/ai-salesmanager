'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        name: '',
        company: '',
        department: '',
        position: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('パスワードが一致しません');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.push('/login?registered=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'エラーが発生しました');
        } finally {
            setIsLoading(false);
        }
    };

    const fields = [
        { name: 'name', label: '名前', type: 'text', placeholder: '山田 太郎' },
        { name: 'company', label: '会社名', type: 'text', placeholder: '株式会社サンプル' },
        { name: 'department', label: '部署名', type: 'text', placeholder: '営業部' },
        { name: 'position', label: '役職', type: 'text', placeholder: '課長' },
        { name: 'email', label: 'メールアドレス', type: 'email', placeholder: 'taro@example.com' },
        { name: 'phone', label: '携帯電話番号（2段階認証用）', type: 'tel', placeholder: '+81901234567' },
        { name: 'password', label: 'パスワード（8文字以上）', type: 'password', placeholder: '' },
        { name: 'confirmPassword', label: 'パスワード（確認）', type: 'password', placeholder: '' },
    ];

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h1 style={titleStyle}>📝 アカウント登録</h1>
                <p style={descStyle}>AI営業マネージャーをご利用いただくにはアカウント登録が必要です。</p>

                {error && <div style={errorStyle}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {fields.map((f) => (
                        <div key={f.name} style={fieldStyle}>
                            <label style={labelStyle}>{f.label}</label>
                            <input
                                name={f.name}
                                type={f.type}
                                placeholder={f.placeholder}
                                value={form[f.name as keyof typeof form]}
                                onChange={handleChange}
                                required
                                style={inputStyle}
                            />
                        </div>
                    ))}

                    <button type="submit" disabled={isLoading} style={btnStyle}>
                        {isLoading ? '登録中...' : 'アカウントを作成する'}
                    </button>
                </form>

                <p style={linkTextStyle}>
                    既にアカウントをお持ちの方は <Link href="/login" style={linkStyle}>ログイン</Link>
                </p>
            </div>
        </div>
    );
}

// ---- インラインスタイル（既存プロジェクトのダークテーマに合わせる） ----
const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a1628 100%)',
    padding: '2rem',
};
const cardStyle: React.CSSProperties = {
    background: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(99, 207, 197, 0.15)',
    borderRadius: '1.5rem',
    padding: '2.5rem',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};
const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    color: '#fff',
    marginBottom: '0.5rem',
};
const descStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#9ca3af',
    marginBottom: '1.5rem',
};
const errorStyle: React.CSSProperties = {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    color: '#fca5a5',
    fontSize: '0.875rem',
    marginBottom: '1rem',
};
const fieldStyle: React.CSSProperties = {
    marginBottom: '1rem',
};
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    color: '#d1d5db',
    marginBottom: '0.25rem',
};
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.65rem 0.75rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.8rem',
    background: 'linear-gradient(135deg, #63cfc5, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.5rem',
};
const linkTextStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '1.25rem',
    color: '#9ca3af',
    fontSize: '0.85rem',
};
const linkStyle: React.CSSProperties = {
    color: '#63cfc5',
};
