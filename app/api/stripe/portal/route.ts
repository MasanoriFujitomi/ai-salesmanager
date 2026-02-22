import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getTenant } from '@/lib/tenant-store';

export async function POST() {
    const tenant = getTenant();

    if (!tenant.stripeCustomerId) {
        return NextResponse.json({ error: 'Stripe顧客情報がありません。まずプランを契約してください。' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
}
