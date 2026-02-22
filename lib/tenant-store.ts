import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

export type TenantStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface Tenant {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    status: TenantStatus;
    planId: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    subscriptionStart: string | null;
    subscriptionEnd: string | null;
    nextBillingDate: string | null;
    paymentFailureCount: number;
    billingInfo: BillingInfo;
    createdAt: string;
    updatedAt: string;
}

export interface BillingInfo {
    companyName: string;
    department: string;
    contactName: string;
    postalCode: string;
    address: string;
    billingEmail: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const TENANT_FILE = path.join(DATA_DIR, 'tenant.json');

// デフォルトテナント（シングルテナントSaaS想定）
const DEFAULT_TENANT: Tenant = {
    id: 'default',
    companyName: '株式会社サンプル',
    contactName: '',
    email: '',
    status: 'trial',
    planId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStart: null,
    subscriptionEnd: null,
    nextBillingDate: null,
    paymentFailureCount: 0,
    billingInfo: {
        companyName: '',
        department: '',
        contactName: '',
        postalCode: '',
        address: '',
        billingEmail: '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

function ensureDir() {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
}

export function getTenant(): Tenant {
    ensureDir();
    if (!existsSync(TENANT_FILE)) {
        saveTenant(DEFAULT_TENANT);
        return DEFAULT_TENANT;
    }
    try {
        const raw = readFileSync(TENANT_FILE, 'utf-8');
        return JSON.parse(raw) as Tenant;
    } catch {
        return DEFAULT_TENANT;
    }
}

export function saveTenant(tenant: Tenant): void {
    ensureDir();
    tenant.updatedAt = new Date().toISOString();
    writeFileSync(TENANT_FILE, JSON.stringify(tenant, null, 2), 'utf-8');
}

export function updateTenant(updates: Partial<Tenant>): Tenant {
    const current = getTenant();
    const updated = { ...current, ...updates };
    saveTenant(updated);
    return updated;
}
