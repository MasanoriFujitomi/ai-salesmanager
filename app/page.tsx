'use client';

import Link from 'next/link';
import styles from './page.module.css';

const FEATURES = [
  {
    icon: '🎙',
    title: '音声でヒアリング',
    desc: '商談後の内容をマイクまたはテキストで入力。AIマネージャーが丁寧にヒアリングします。',
  },
  {
    icon: '🔍',
    title: 'SPIN分析',
    desc: '状況・問題・示唆・解決の4つの観点で商談内容を自動分析。スコアで可視化します。',
  },
  {
    icon: '📋',
    title: 'アクションプラン提案',
    desc: '商談の結果に基づき、次回に向けた具体的なアクションプランを自動生成します。',
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Background gradient orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.badge}>AI-Powered Sales Intelligence</div>
          <h1 className={styles.title}>
            AI 営業マネージャー
          </h1>
          <p className={styles.subtitle}>
            商談後の振り返りをAIがサポート。
            <br />
            <span className={styles.highlight}>SPIN営業術</span>に基づく分析で、
            あなたの営業力を次のレベルへ。
          </p>
          <Link href="/session" className={styles.ctaBtn}>
            セッションを開始する →
          </Link>
          <Link href="/history" className={styles.historyBtn}>
            📋 商談履歴
          </Link>
          <Link href="/billing" className={styles.billingBtn}>
            💳 請求・プラン管理
          </Link>
        </header>

        <section className={styles.features}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </section>

        <section className={styles.spinInfo}>
          <h2 className={styles.spinTitle}>SPIN 営業術とは？</h2>
          <div className={styles.spinGrid}>
            {[
              { key: 'S', label: 'Situation（状況）', desc: '顧客の現在の状況・背景を把握する', color: '#63cfc5' },
              { key: 'P', label: 'Problem（問題）', desc: '顧客が抱える課題・悩みを引き出す', color: '#f59e0b' },
              { key: 'I', label: 'Implication（示唆）', desc: '問題の影響・重大性を認識させる', color: '#ef4444' },
              { key: 'N', label: 'Need-payoff（解決）', desc: '解決策の価値をお客様自身に語らせる', color: '#10b981' },
            ].map((item) => (
              <div key={item.key} className={styles.spinCard} style={{ borderColor: item.color + '40' }}>
                <div className={styles.spinKey} style={{ color: item.color }}>{item.key}</div>
                <div className={styles.spinLabel}>{item.label}</div>
                <div className={styles.spinDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
