export interface Plan {
    id: 'lite' | 'standard' | 'enterprise';
    name: string;
    description: string;
    price: number; // 月額（円）
    maxUsers: number | null; // nullは無制限
    priceId: string; // Stripe Price ID (環境変数から取得)
    features: string[];
    highlighted?: boolean;
}

export const PLANS: Plan[] = [
    {
        id: 'lite',
        name: 'Lite',
        description: '個人・小規模チーム向けスタータープラン',
        price: 2500,
        maxUsers: 5,
        priceId: process.env.STRIPE_PRICE_LITE || '',
        features: [
            'ユーザー5名まで',
            'SPIN分析レポート',
            '商談履歴（直近30件）',
            'メールサポート',
        ],
    },
    {
        id: 'standard',
        name: 'Standard',
        description: '成長期チームに最適なスタンダードプラン',
        price: 4500,
        maxUsers: 20,
        priceId: process.env.STRIPE_PRICE_STANDARD || '',
        features: [
            'ユーザー20名まで',
            'SPIN分析レポート',
            '商談履歴（無制限）',
            '音声入力サポート',
            'チャットサポート',
            '単語登録（無制限）',
        ],
        highlighted: true,
    },
    {
        id: 'enterprise',
        name: 'Premium',
        description: '大企業・エンタープライズ向けプレミアムプラン',
        price: 9800,
        maxUsers: null,
        priceId: process.env.STRIPE_PRICE_ENTERPRISE || '',
        features: [
            'ユーザー数無制限',
            'SPIN分析レポート',
            '商談履歴（無制限）',
            '音声入力サポート',
            '専任サポート担当',
            'SLA保証',
            'カスタム連携対応',
        ],
    },
];

export function getPlanById(id: string): Plan | undefined {
    return PLANS.find((p) => p.id === id);
}

export function getPlanByPriceId(priceId: string): Plan | undefined {
    return PLANS.find((p) => p.priceId === priceId);
}
