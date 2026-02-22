# AI営業マネージャー 🤝

商談後の振り返りをAIがサポートするWebアプリケーションです。  
SPIN売り込み法に基づいた分析で、営業力を向上させます。

## 機能

- 🎙 **音声入力** - ブラウザの音声認識(Chrome推奨)でハンズフリー入力
- 🔍 **SPIN分析** - 状況・問題・示唆・解決の4観点で商談を自動評価
- 📊 **スコアリング** - 各要素を100点満点でビジュアライズ
- 🚀 **アクションプラン** - 次回商談に向けた具体的な行動を提案
- ✅ **強み・改善点** - AIマネージャーからのフィードバック

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. OpenAI APIキーの設定

`.env.local` ファイルを開き、OpenAI APIキーを設定してください：

```
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```

APIキーは [OpenAI Platform](https://platform.openai.com/api-keys) から取得できます。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

1. トップページの「セッションを開始する」をクリック
2. AIマネージャーの質問に答える（音声またはテキスト）
3. 商談の状況・問題・示唆・解決について詳しく話す
4. 「ありがとう」「終了」と入力するとSPIN分析レポートが生成される
5. 右側パネルで分析結果・スコア・アクションプランを確認

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router) + TypeScript
- **AI**: OpenAI GPT-4o
- **音声認識**: Web Speech API
- **波形可視化**: Web Audio API
- **スタイリング**: CSS Modules (Vanilla CSS)

## SPIN売り込み法とは

| 要素 | 英語 | 目的 |
|------|------|------|
| S | Situation（状況） | 顧客の現在の状況・背景を把握 |
| P | Problem（問題） | 顧客が抱える課題・悩みを引き出す |
| I | Implication（示唆） | 問題の影響・重大性を認識させる |
| N | Need-payoff（解決） | 解決策の価値をお客様自身に語らせる |
