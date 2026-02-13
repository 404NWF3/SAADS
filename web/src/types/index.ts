// ==================== 攻击池数据类型 (STIX 2.1 兼容) ====================
export interface AttackSource {
  type: 'arxiv' | 'cve' | 'nvd' | 'blog' | 'github' | 'darkweb' | 'threat_api';
  url: string;
  crawl_time: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AttackTemplate {
  name: string;
  description: string;
  payload_template: string;
  variables: Record<string, string>;
  modality: 'text' | 'image' | 'audio';
  mutation_hints: string[];
}

export interface MitreMapping {
  tactic: string;
  technique: string;
}

export interface AttackMetadata {
  severity_estimate: 'critical' | 'high' | 'medium' | 'low';
  target_type: string[];
  defense_bypass: string[];
  effectiveness: number | null;
  last_tested: string | null;
}

export interface AttackEntry {
  attack_id: string;
  category: 'prompt_injection' | 'jailbreak' | 'info_leakage' | 'multimodal' | 'dos' | 'agent_hijack';
  subcategory: string;
  stix_type: string;
  source: AttackSource;
  attack_template: AttackTemplate;
  mitre_mapping: MitreMapping;
  metadata: AttackMetadata;
  status: 'active' | 'tested' | 'deprecated';
}

// ==================== 漏洞报告数据类型 ====================
export interface TargetApplication {
  name: string;
  api_endpoint: string;
  model: string;
  has_system_prompt: boolean;
  has_tools: boolean;
  has_rag: boolean;
}

export interface AttackStep {
  step: number;
  action: string;
  input: string;
  output: string;
}

export interface AttackVector {
  successful_payload: string;
  modality: 'text' | 'image' | 'audio';
  attack_steps: AttackStep[];
  success_indicator: string;
}

export interface Remediation {
  suggestion: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  references: string[];
}

export interface Vulnerability {
  type: string;
  subtype: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss_score: number;
  cvss_vector: string;
  description: string;
  attack_vector: AttackVector;
  remediation: Remediation;
}

export interface Reproduction {
  deterministic: boolean;
  success_rate: string;
  environment_requirements: string;
  mutation_variants_tested: number;
}

export interface ExecutableScript {
  language: string;
  path: string;
  description: string;
}

export interface VulnReport {
  vuln_id: string;
  source_attack_id: string;
  target_application: TargetApplication;
  vulnerability: Vulnerability;
  reproduction: Reproduction;
  executable_script: ExecutableScript;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'rejected';
}

// ==================== 标注数据类型 ====================
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  is_attack_turn?: boolean;
  attack_technique?: string;
  is_compromised?: boolean;
  compromise_type?: string;
}

export interface ModelInteraction {
  conversation: ConversationTurn[];
}

export interface NetworkTrace {
  pcap_path: string;
  summary: {
    total_packets: number;
    protocols: string[];
    payload_size_bytes: number;
  };
}

export interface SystemLog {
  log_path: string;
  anomaly_indicators: string[];
}

export interface Features {
  input_length: number;
  contains_encoded_content: boolean;
  language_switch_count: number;
  instruction_override_patterns: number;
  response_time_ms: number;
  token_count_input: number;
  token_count_output: number;
}

export interface LabeledSample {
  sample_id: string;
  source_vuln_id: string;
  label: 'malicious' | 'benign';
  attack_type: string;
  model_interaction: ModelInteraction;
  network_trace: NetworkTrace;
  system_log: SystemLog;
  features: Features;
  generation_method: 'mutation' | 'original' | 'synthetic';
  mutation_from?: string;
}

// ==================== 模型训练数据类型 ====================
export interface ModelMetrics {
  f1_score: number;
  auc: number;
  precision: number;
  recall: number;
  false_positive_rate: number;
  false_negative_rate: number;
}

export interface TrainedModel {
  model_id: string;
  model_type: 'random_forest' | 'xgboost' | 'cnn' | 'transformer' | 'deeplog' | 'gan';
  version: string;
  trained_at: string;
  metrics: ModelMetrics;
  feature_importance: Record<string, number>;
  status: 'training' | 'evaluating' | 'deployed' | 'archived';
}

// ==================== Dashboard 统计数据类型 ====================
export interface AttackPoolStats {
  total: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  by_severity: Record<string, number>;
  recent_trend: { date: string; count: number }[];
}

export interface VulnReportStats {
  total: number;
  confirmed: number;
  pending: number;
  rejected: number;
  by_severity: Record<string, number>;
  cvss_distribution: { range: string; count: number }[];
  owasp_coverage: { category: string; covered: number; total: number }[];
}

export interface SandboxStats {
  total_samples: number;
  malicious_samples: number;
  benign_samples: number;
  pcap_files: number;
  total_size_mb: number;
}

export interface IDSStats {
  models_trained: number;
  best_model: string;
  best_f1: number;
  deployed_models: number;
}

// ==================== Pipeline 状态类型 ====================
export interface PipelineStage {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface PipelineStatus {
  current_stage: string;
  stages: PipelineStage[];
  last_run: string;
  total_runs: number;
}
