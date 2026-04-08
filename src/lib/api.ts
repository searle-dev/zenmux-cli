const BASE_URL = 'https://zenmux.ai';
const TIMEOUT_MS = 10000;

async function get<T>(path: string, apiKey: string, accountName: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Invalid management key for account "${accountName}"`);
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json() as { success: boolean; data: T };
    return json.data;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timeout. Please check your network.');
    }
    throw err;
  }
}

export interface SubscriptionData {
  plan: { tier: string; amount_usd: number; expires_at: string };
  account_status: string;
  base_usd_per_flow: number;
  effective_usd_per_flow: number;
  quota_5_hour: { used_flows: number; max_flows: number; usage_percentage: number; resets_at: string };
  quota_7_day: { used_flows: number; max_flows: number; usage_percentage: number; resets_at: string };
  quota_monthly: { max_flows: number; max_value_usd?: number; used_flows?: number };
}

export interface PaygData {
  currency: string;
  total_credits: number;
  top_up_credits: number;
  bonus_credits: number;
}

export interface FlowRateData {
  currency: string;
  base_usd_per_flow: number;
  effective_usd_per_flow: number;
}

export interface GenerationData {
  api: string;
  generationId: string;
  model: string;
  createAt: string;
  generationTime: number;
  latency: number;
  nativeTokens: { completion: number; prompt: number; cached: number; reasoning: number };
  streamed: boolean;
  finishReason: string;
  usage: number;
}

export const api = {
  getSubscription: (key: string, accountName: string) =>
    get<SubscriptionData>('/api/v1/management/subscription/detail', key, accountName),
  getPayg: (key: string, accountName: string) =>
    get<PaygData>('/api/v1/management/payg/balance', key, accountName),
  getFlowRate: (key: string, accountName: string) =>
    get<FlowRateData>('/api/v1/management/flow_rate', key, accountName),
  getGeneration: (key: string, id: string, accountName: string) =>
    get<GenerationData>(`/api/v1/management/generation?id=${encodeURIComponent(id)}`, key, accountName),
};
