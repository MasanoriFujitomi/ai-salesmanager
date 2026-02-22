import { NextRequest, NextResponse } from 'next/server';
import { getTenant, updateTenant } from '@/lib/tenant-store';
import { stripe } from '@/lib/stripe';

export async function GET() {
    const tenant = getTenant();
    return NextResponse.json({ tenant });
}

export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const { billingInfo } = body;

    const tenant = getTenant();
    const updated = updateTenant({ billingInfo: { ...tenant.billingInfo, ...billingInfo } });

    // Stripeの顧客情報も更新（可能な範囲で）
    if (updated.stripeCustomerId && billingInfo) {
        try {
            await stripe.customers.update(updated.stripeCustomerId, {
                name: billingInfo.companyName || undefined,
                email: billingInfo.billingEmail || undefined,
                address: billingInfo.address ? {
                    line1: billingInfo.address,
                    postal_code: billingInfo.postalCode || undefined,
                    country: 'JP',
                } : undefined,
            });
        } catch (e) {
            console.error('Stripe顧客情報更新エラー:', e);
        }
    }

    return NextResponse.json({ tenant: updated });
}
