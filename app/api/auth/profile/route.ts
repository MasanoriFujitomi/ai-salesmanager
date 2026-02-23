// プロフィール取得・更新API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                name: true,
                company: true,
                department: true,
                position: true,
                phone: true,
                calendarEnabled: true,
            },
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
        }

        const body = await req.json();

        // 更新可能なフィールドのみ抽出
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: Record<string, any> = {};
        if (body.name !== undefined) data.name = body.name;
        if (body.company !== undefined) data.company = body.company;
        if (body.department !== undefined) data.department = body.department;
        if (body.position !== undefined) data.position = body.position;
        if (body.phone !== undefined) data.phone = body.phone;
        if (typeof body.calendarEnabled === 'boolean') data.calendarEnabled = body.calendarEnabled;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data,
        });

        return NextResponse.json({ message: '更新しました', user });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }
}
