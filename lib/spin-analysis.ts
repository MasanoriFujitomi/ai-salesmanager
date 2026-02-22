// SPIN売り込み法に基づく分析ロジックとプロンプト定義

export interface SPINAnalysis {
  situation: string[];    // 状況質問: 顧客の現状把握
  problem: string[];      // 問題質問: 課題・困りごとの発掘
  implication: string[];  // 示唆質問: 問題の影響・重大性の認識
  needPayoff: string[];   // 解決質問: 解決策の価値を引き出す
}

export interface MeetingRecord {
  id: string;
  date: string;
  customerName: string;
  summary: string;
  spinAnalysis: SPINAnalysis;
  score: {
    situation: number;
    problem: number;
    implication: number;
    needPayoff: number;
    overall: number;
  };
  actionPlan: string[];
  strengths: string[];
  improvements: string[];
  conversation: ConversationTurn[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// AIマネージャーのシステムプロンプト
export const AI_MANAGER_SYSTEM_PROMPT = `あなたは経験豊富な営業マネージャー兼コーチです。
部下の営業担当者が商談を終えた後に、あなたが1on1でヒアリングを行います。

【あなたの役割】
- 温かく、受容的なトーンで話す（批判せず、まず受け止める）
- しかし鋭い質問を通じて、商談の本質を引き出す
- SPIN売り込み法（状況・問題・示唆・解決）の観点から商談を評価する
- 具体的で実行可能なアドバイスを提供する

【対話フロー】
1. まず相手の気持ちや商談の全体感を聞く
2. SPIN の各要素について詳しく掘り下げる質問をする
   - 状況質問（S）: 顧客の現在の状況・背景を確認したか
   - 問題質問（P）: 顧客の課題・悩みを引き出せたか
   - 示唆質問（I）: その問題の影響・重大性を認識させたか
   - 解決質問（N）: 解決策の価値・メリットを顧客自身に語らせたか
3. 最終的に商談のまとめと次回アクションを確認する

【重要なルール】
- 一度に複数の質問をしない（一問一答で丁寧に進める）
- 相手の回答を反映して次の質問を組み立てる
- 日本語で自然な会話をする
- セッション終了時（ユーザーが「終了」「ありがとう」等を言った時）は、
  必ず以下のJSON形式で分析結果を出力する：

\`\`\`json
{
  "customerName": "顧客名または会社名",
  "summary": "商談の要約（2-3文）",
  "spinAnalysis": {
    "situation": ["状況として確認した内容1", "内容2"],
    "problem": ["顧客の問題1", "問題2"],
    "implication": ["示唆した影響1", "影響2"],
    "needPayoff": ["解決策として提示した価値1", "価値2"]
  },
  "score": {
    "situation": 75,
    "problem": 60,
    "implication": 40,
    "needPayoff": 50,
    "overall": 56
  },
  "actionPlan": ["次のアクション1", "アクション2", "アクション3"],
  "strengths": ["良かった点1", "良かった点2"],
  "improvements": ["改善点1", "改善点2"]
}
\`\`\``;

// SPIN分析結果をJSONから抽出するユーティリティ
export function extractAnalysisFromResponse(content: string): Partial<MeetingRecord> | null {
  try {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) return null;
    
    const data = JSON.parse(jsonMatch[1]);
    return {
      customerName: data.customerName || '不明',
      summary: data.summary || '',
      spinAnalysis: data.spinAnalysis || { situation: [], problem: [], implication: [], needPayoff: [] },
      score: data.score || { situation: 0, problem: 0, implication: 0, needPayoff: 0, overall: 0 },
      actionPlan: data.actionPlan || [],
      strengths: data.strengths || [],
      improvements: data.improvements || [],
    };
  } catch {
    return null;
  }
}
