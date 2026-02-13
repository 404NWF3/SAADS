import type {
  AttackEntry,
  VulnReport,
  AttackPoolStats,
  VulnReportStats,
  SandboxStats,
  IDSStats,
  PipelineStatus,
} from '../types';
import {
  mockAttackEntries,
  mockVulnReports,
  mockAttackPoolStats,
  mockVulnReportStats,
  mockSandboxStats,
  mockIDSStats,
  mockPipelineStatus,
} from '../mock/data';

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== 攻击池 API ====================
export const attackPoolApi = {
  // 获取攻击列表
  async getList(): Promise<AttackEntry[]> {
    await delay(300);
    return mockAttackEntries;
  },

  // 获取单个攻击详情
  async getById(attackId: string): Promise<AttackEntry | undefined> {
    await delay(200);
    return mockAttackEntries.find(a => a.attack_id === attackId);
  },

  // 获取统计数据
  async getStats(): Promise<AttackPoolStats> {
    await delay(200);
    return mockAttackPoolStats;
  },
};

// ==================== 漏洞报告 API ====================
export const vulnReportApi = {
  // 获取漏洞报告列表
  async getList(): Promise<VulnReport[]> {
    await delay(300);
    return mockVulnReports;
  },

  // 获取单个漏洞报告详情
  async getById(vulnId: string): Promise<VulnReport | undefined> {
    await delay(200);
    return mockVulnReports.find(v => v.vuln_id === vulnId);
  },

  // 获取统计数据
  async getStats(): Promise<VulnReportStats> {
    await delay(200);
    return mockVulnReportStats;
  },
};

// ==================== 沙盒模拟 API ====================
export const sandboxApi = {
  // 获取统计数据
  async getStats(): Promise<SandboxStats> {
    await delay(200);
    return mockSandboxStats;
  },
};

// ==================== 入侵检测 API ====================
export const idsApi = {
  // 获取统计数据
  async getStats(): Promise<IDSStats> {
    await delay(200);
    return mockIDSStats;
  },
};

// ==================== 流水线 API ====================
export const pipelineApi = {
  // 获取流水线状态
  async getStatus(): Promise<PipelineStatus> {
    await delay(200);
    return mockPipelineStatus;
  },

  // 触发流水线运行
  async trigger(): Promise<{ success: boolean; message: string }> {
    await delay(500);
    return { success: true, message: '流水线已启动' };
  },
};
