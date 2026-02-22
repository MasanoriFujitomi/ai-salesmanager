import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getTenant, updateTenant } from '@/lib/tenant-store';
import { getPlanByPriceId } from '@/lib/plans';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret || !sig) {
        return NextResponse.json({ error: 'Webhook設定が不正です' }, { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook署名検証失敗:', err);
        return NextResponse.json({ error: 'Webhook署名が無効です' }, { status: 400 });
    }

    const tenant = getTenant();

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as { subscription?: string; customer?: string };
            if (session.subscription && session.customer) {
                const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                const priceId = sub.items.data[0]?.price?.id || '';
                const plan = getPlanByPriceId(priceId);
                updateTenant({
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    status: 'active',
                    planId: plan?.id || null,
                    subscriptionStart: new Date(sub.start_date * 1000).toISOString(),
                    nextBillingDate: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toLocaleDateString('ja-JP'),
                    paymentFailureCount: 0,
                });
            }
            break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as { subscription?: string; customer?: string };
            if (invoice.customer === tenant.stripeCustomerId) {
                updateTenant({ status: 'active', paymentFailureCount: 0 });
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as { customer?: string };
            if (invoice.customer === tenant.stripeCustomerId) {
                const newCount = (tenant.paymentFailureCount || 0) + 1;
                updateTenant({
                    paymentFailureCount: newCount,
                    status: newCount >= 3 ? 'suspended' : 'past_due',
                });
            }
            break;
        }

        case 'customer.subscription.updated': {
            const sub = event.data.object as { customer?: string; status?: string; current_period_end?: number; items?: { data?: Array<{ price?: { id?: string } }> } };
            if (sub.customer === tenant.stripeCustomerId) {
                const priceId = sub.items?.data?.[0]?.price?.id || '';
                const plan = getPlanByPriceId(priceId);
                updateTenant({
                    planId: plan?.id || tenant.planId,
                    status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'suspended',
                    nextBillingDate: sub.current_period_end
                        ? new Date(sub.current_period_end * 1000).toLocaleDateString('ja-JP')
                        : tenant.nextBillingDate,
                });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as { customer?: string };
            if (sub.customer === tenant.stripeCustomerId) {
                updateTenant({
                    status: 'cancelled',
                    stripeSubscriptionId: null,
                    planId: null,
                });
            }
            break;
        }

        case 'payment_intent.succeeded': {
            console.log('payment_intent.succeeded', event.id);
            break;
        }
    }

    return NextResponse.json({ received: true });
}
