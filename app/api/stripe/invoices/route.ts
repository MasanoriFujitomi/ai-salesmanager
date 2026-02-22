import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getTenant } from '@/lib/tenant-store';

export async function GET() {
    const tenant = getTenant();

    if (!tenant.stripeCustomerId) {
        return NextResponse.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
        customer: tenant.stripeCustomerId,
        limit: 20,
    });

    const formatted = invoices.data.map((inv) => ({
        id: inv.id,
        date: new Date(inv.created * 1000).toLocaleDateString('ja-JP'),
        amount: `¥${inv.amount_paid.toLocaleString('ja-JP')}`,
        status: inv.status,
        statusLabel: getStatusLabel(inv.status),
        pdfUrl: inv.invoice_pdf,
        hostedUrl: inv.hosted_invoice_url,
    }));

    return NextResponse.json({ invoices: formatted });
}

function getStatusLabel(status: string | null): string {
    switch (status) {
        case 'paid': return '支払済';
        case 'open': return '未払い';
        case 'uncollectible': return '回収不能';
        case 'void': return '無効';
        case 'draft': return '下書き';
        default: return status || '不明';
    }
}
