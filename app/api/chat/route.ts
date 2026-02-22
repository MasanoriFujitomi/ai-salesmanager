import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AI_MANAGER_SYSTEM_PROMPT } from '@/lib/spin-analysis';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json();

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            return NextResponse.json(
                { error: 'OpenAI APIキーが設定されていません。.env.localファイルにAPIキーを設定してください。' },
                { status: 400 }
            );
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: AI_MANAGER_SYSTEM_PROMPT },
                ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content || '';

        return NextResponse.json({ content });
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json(
            { error: 'AIとの通信でエラーが発生しました。しばらく待ってからお試しください。' },
            { status: 500 }
        );
    }
}
