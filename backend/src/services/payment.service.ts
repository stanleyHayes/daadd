import axios from 'axios';
import crypto from 'crypto';

/**
 * Payment provider abstraction (Phase 4). DAADD never hardcodes one PSP — this
 * is the interface every provider implements, with Paystack as the first (and
 * currently only) adapter. Select with PSP_PROVIDER (default 'paystack').
 *
 * All amounts are integer MINOR units (pesewas for GHS) end to end — never a
 * float, never dollars, and never the token ledger.
 */
export interface InitializeParams {
  email: string;
  amount_minor: number;
  currency: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  /** When set, Paystack splits the charge to this merchant subaccount. */
  subaccount?: string;
}

export interface Bank {
  name: string;
  code: string;
}

export interface ResolvedAccount {
  account_number: string;
  account_name: string;
}

export interface SubaccountParams {
  business_name: string;
  bank_code: string;
  account_number: string;
  /** The percentage the PLATFORM (main account) keeps; the rest goes to the merchant. */
  percentage_charge: number;
}

export interface CreatedSubaccount {
  subaccount_code: string;
  account_name?: string;
}

export interface InitializeResult {
  authorization_url: string;
  reference: string;
}

export type ProviderTxnStatus = 'success' | 'failed' | 'abandoned' | 'pending';

export interface VerifyResult {
  status: ProviderTxnStatus;
  amount_minor: number;
  currency: string;
  reference: string;
  gateway_response?: string;
  paid_at?: string | null;
}

export interface ParsedWebhook {
  /** Stable per-event identity used for exactly-once processing. */
  event_id: string;
  event_type: string;
  reference: string;
  status: ProviderTxnStatus;
  amount_minor: number;
  currency: string;
}

export interface RefundResult {
  status: 'pending' | 'processed' | 'failed';
  reference: string;
}

export interface PaymentProvider {
  name: string;
  initializeCharge(params: InitializeParams): Promise<InitializeResult>;
  verifyTransaction(reference: string): Promise<VerifyResult>;
  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean;
  parseWebhook(body: unknown): ParsedWebhook | null;
  /** Refund a charge, in full or (with amount_minor) partially. */
  refund(reference: string, amount_minor?: number): Promise<RefundResult>;
  /** Banks (and mobile-money providers) available for settlement in a currency. */
  listBanks(currency: string): Promise<Bank[]>;
  /** Verify an account number against a bank; returns the account-holder name. */
  resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount>;
  /** Create a merchant settlement subaccount; the PSP verifies the bank account. */
  createSubaccount(params: SubaccountParams): Promise<CreatedSubaccount>;
}

/** Constant-time compare of two hex digests (guards against timing attacks). */
function hexEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function mapPaystackStatus(status: string | undefined): ProviderTxnStatus {
  if (status === 'success') return 'success';
  if (status === 'abandoned') return 'abandoned';
  if (status === 'failed' || status === 'reversed') return 'failed';
  return 'pending';
}

// --- Paystack adapter ------------------------------------------------------

class PaystackProvider implements PaymentProvider {
  name = 'paystack';

  private secret(): string {
    return process.env.PAYSTACK_SECRET_KEY || '';
  }
  private baseUrl(): string {
    return process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co';
  }
  private headers() {
    return { Authorization: `Bearer ${this.secret()}`, 'Content-Type': 'application/json' };
  }

  async initializeCharge(params: InitializeParams): Promise<InitializeResult> {
    const { data } = await axios.post(
      `${this.baseUrl()}/transaction/initialize`,
      {
        email: params.email,
        amount: params.amount_minor, // Paystack expects the minor unit (pesewas)
        currency: params.currency,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
        // Split the charge to the merchant's subaccount when one is provided.
        ...(params.subaccount ? { subaccount: params.subaccount } : {}),
      },
      { headers: this.headers(), timeout: 15000 }
    );
    const d = data?.data || {};
    if (!d.authorization_url) throw new Error('Paystack did not return an authorization URL');
    return { authorization_url: d.authorization_url, reference: d.reference || params.reference };
  }

  async verifyTransaction(reference: string): Promise<VerifyResult> {
    const { data } = await axios.get(
      `${this.baseUrl()}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: this.headers(), timeout: 15000 }
    );
    const d = data?.data || {};
    return {
      status: mapPaystackStatus(d.status),
      amount_minor: Number(d.amount) || 0,
      currency: d.currency || 'GHS',
      reference: d.reference || reference,
      gateway_response: d.gateway_response,
      paid_at: d.paid_at || d.paidAt || null,
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
    const secret = this.secret();
    if (!secret || !signature || !rawBody) return false;
    // Paystack signs the raw body with HMAC-SHA512 keyed by the secret key.
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    return hexEqual(expected, signature);
  }

  parseWebhook(body: unknown): ParsedWebhook | null {
    const b = body as { event?: string; data?: Record<string, unknown> } | null;
    const data = b?.data;
    if (!b?.event || !data) return null;
    const reference = String(data.reference ?? '');
    // Prefer the immutable transaction id for identity; fall back to reference.
    const idPart = data.id != null ? String(data.id) : reference;
    return {
      event_id: `${b.event}:${idPart}`,
      event_type: b.event,
      reference,
      status: mapPaystackStatus(data.status as string | undefined),
      amount_minor: Number(data.amount) || 0,
      currency: (data.currency as string) || 'GHS',
    };
  }

  async refund(reference: string, amount_minor?: number): Promise<RefundResult> {
    const { data } = await axios.post(
      `${this.baseUrl()}/refund`,
      { transaction: reference, ...(amount_minor != null ? { amount: amount_minor } : {}) },
      { headers: this.headers(), timeout: 15000 }
    );
    const d = data?.data || {};
    const status = d.status === 'processed' ? 'processed' : d.status === 'failed' ? 'failed' : 'pending';
    return { status, reference };
  }

  async listBanks(currency: string): Promise<Bank[]> {
    const { data } = await axios.get(`${this.baseUrl()}/bank`, {
      headers: this.headers(),
      params: { currency },
      timeout: 15000,
    });
    return (data?.data || []).map((b: { name: string; code: string }) => ({ name: b.name, code: b.code }));
  }

  async resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
    const { data } = await axios.get(`${this.baseUrl()}/bank/resolve`, {
      headers: this.headers(),
      params: { account_number: accountNumber, bank_code: bankCode },
      timeout: 15000,
    });
    const d = data?.data || {};
    return { account_number: d.account_number || accountNumber, account_name: d.account_name || '' };
  }

  async createSubaccount(params: SubaccountParams): Promise<CreatedSubaccount> {
    const { data } = await axios.post(
      `${this.baseUrl()}/subaccount`,
      {
        business_name: params.business_name,
        settlement_bank: params.bank_code,
        account_number: params.account_number,
        percentage_charge: params.percentage_charge,
      },
      { headers: this.headers(), timeout: 15000 }
    );
    const d = data?.data || {};
    if (!d.subaccount_code) throw new Error('Paystack did not return a subaccount code');
    return { subaccount_code: d.subaccount_code, account_name: d.account_name };
  }
}

// --- Selection + config ----------------------------------------------------

const PROVIDERS: Record<string, PaymentProvider> = {
  paystack: new PaystackProvider(),
};

/** The configured provider. Throws if PSP_PROVIDER names an unknown provider. */
export function resolveProvider(): PaymentProvider {
  const name = (process.env.PSP_PROVIDER || 'paystack').toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown PSP_PROVIDER '${name}'`);
  return provider;
}

/**
 * Whether real payments are wired. Requires the PSP secret to be present.
 * With no key set the payment endpoints are inert (503) — a deliberate safety
 * gate so nothing charges before live keys AND the settlement-structure legal
 * sign-off are in place.
 */
export function paymentsEnabled(): boolean {
  if (process.env.PAYMENTS_ENABLED === 'false') return false;
  return !!process.env.PAYSTACK_SECRET_KEY;
}
