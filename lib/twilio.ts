// Twilioクライアント初期化 + SMS送信ユーティリティ
import twilio from 'twilio';

// 環境変数が未設定の場合はnullを返す（ビルド時にエラーにしない）
function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return null;
    return twilio(accountSid, authToken);
}

// 6桁の2FAコードを生成
export function generate2FACode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// SMS送信
export async function send2FACode(phone: string, code: string): Promise<boolean> {
    const client = getTwilioClient();
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!client || !fromNumber) {
        // Twilio未設定時はコンソールに出力（開発用）
        console.log(`[2FA DEV MODE] コード: ${code} → ${phone}`);
        return true;
    }

    try {
        await client.messages.create({
            body: `【AI営業マネージャー】認証コード: ${code}（5分間有効）`,
            from: fromNumber,
            to: phone,
        });
        return true;
    } catch (error) {
        console.error('SMS送信エラー:', error);
        return false;
    }
}
