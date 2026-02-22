import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getTenant, updateTenant } from '@/lib/tenant-store';
import { getPlanById } from '@/lib/plans';

export async function POST(req: NextRequest) {
    const { planId, email, companyName } = await req.json();

    const plan = getPlanById(planId);
    if (!plan || !plan.priceId) {
        return NextResponse.json({ error: 'プランが見つかりません。Stripe Price IDが設定されているか確認してください。' }, { status: 400 });
    }

    const tenant = getTenant();
    let customerId = tenant.stripeCustomerId;

    // Stripe Customerがなければ作成
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: email || tenant.billingInfo.billingEmail || undefined,
            name: companyName || tenant.companyName,
            metadata: { tenantId: tenant.id },
        });
        customerId = customer.id;
        updateTenant({ stripeCustomerId: customerId });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: plan.priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/billing/cancel`,
        locale: 'ja',
        subscription_data: {
            metadata: { tenantId: tenant.id, planId },
        },
    });

    return NextResponse.json({ url: session.url });
}
