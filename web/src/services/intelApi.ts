// WP1-1 情报采集智能体：对接 LLM-Intel-Auto 后端 (/api/intel/*)
import type { AttackEntry, AttackPoolStats, IntelItem, IntelStats, IntelCollectJob } from '../types';

const BASE = (import.meta.env.VITE_INTEL_API_BASE as string | undefined) ?? '/api/intel';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`情报后端请求失败 (${res.status}): ${text.slice(0, 200) || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const TOPIC_TO_CATEGORY: Record<string, AttackEntry['category']> = {
  'prompt injection': 'prompt_injection',
  jailbreak: 'jailbreak',
  'data leakage': 'info_leakage',
  'agent tool abuse': 'agent_hijack',
  'rag poisoning': 'prompt_injection',
  'model supply chain': 'agent_hijack',
};

const SOURCE_TO_TYPE: Record<string, AttackEntry['source']['type']> = {
  arxiv_api: 'arxiv',
  nvd_cve_api: 'nvd',
  cisa_kev_json: 'cve',
  osv_dev_api: 'threat_api',
};

const severityOf = (item: IntelItem): AttackEntry['metadata']['severity_estimate'] => {
  const s = (item.severity || '').toLowerCase();
  if (s === 'critical' || s === 'high' || s === 'medium' || s === 'low') return s;
  const r = item.relevance_score;
  return r >= 0.85 ? 'critical' : r >= 0.7 ? 'high' : r >= 0.5 ? 'medium' : 'low';
};

export function toAttackEntry(item: IntelItem): AttackEntry {
  const topic = item.topics[0];
  const r = item.relevance_score;
  return {
    attack_id: item.item_id,
    category: (topic && TOPIC_TO_CATEGORY[topic]) || 'prompt_injection',
    subcategory: item.topics.join(', ') || 'unclassified',
    stix_type: 'vulnerability',
    source: {
      type: SOURCE_TO_TYPE[item.source_name] || 'threat_api',
      url: item.source_uri || '',
      crawl_time: item.fetched_at || '',
      confidence: r >= 0.75 ? 'high' : r >= 0.5 ? 'medium' : 'low',
    },
    attack_template: {
      name: item.title || item.item_id,
      description: item.summary || '',
      payload_template: '',
      variables: {},
      modality: 'text',
      mutation_hints: [],
    },
    mitre_mapping: { tactic: 'N/A', technique: item.source_name },
    metadata: {
      severity_estimate: severityOf(item),
      target_type: item.topics,
      defense_bypass: [],
      effectiveness: Math.round(r * 100) / 100,
      last_tested: item.published_at,
    },
    status: 'active',
  };
}

export const intelApi = {
  getItems: (limit = 1000) => request<IntelItem[]>(`/items?limit=${limit}`),
  getStats: () => request<IntelStats>('/stats'),
  getCollectStatus: () => request<IntelCollectJob>('/collect'),
  triggerCollect: (body: { mode?: 'incremental' | 'full'; focus?: string; window_days?: number; max_rounds?: number; max_api_calls?: number } = {}) =>
    request<IntelCollectJob>('/collect', { method: 'POST', body: JSON.stringify(body) }),

  /** 以仪表盘既有的攻击池结构返回真实情报数据 */
  async getAttackPool(): Promise<{ attacks: AttackEntry[]; stats: AttackPoolStats; raw: IntelStats }> {
    const [items, raw] = await Promise.all([intelApi.getItems(), intelApi.getStats()]);
    const attacks = items.map(toAttackEntry);
    const by_category: Record<string, number> = {};
    const by_severity: Record<string, number> = {};
    const by_source: Record<string, number> = {};
    for (const a of attacks) {
      by_category[a.category] = (by_category[a.category] || 0) + 1;
      by_severity[a.metadata.severity_estimate] = (by_severity[a.metadata.severity_estimate] || 0) + 1;
      by_source[a.source.type] = (by_source[a.source.type] || 0) + 1;
    }
    // 趋势按发布日期统计最近 14 天有数据的日期
    const trend: Record<string, number> = {};
    for (const it of items) {
      const d = (it.published_at || it.fetched_at || '').slice(0, 10);
      if (d) trend[d] = (trend[d] || 0) + 1;
    }
    const recent_trend = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b)).slice(-14)
      .map(([date, count]) => ({ date, count }));
    return { attacks, stats: { total: raw.total, by_category, by_source, by_severity, recent_trend }, raw };
  },
};
