import { APIRequestContext } from '@playwright/test';
import { AgentRequest, AgentResponse } from './types';

// API client for the agent service (cheatsheet #8; SDET doc api/clients).
export class AgentClient {
  private baseUrl: string;

  constructor(private request: APIRequestContext, baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  async run(req: AgentRequest): Promise<AgentResponse> {
    const res = await this.request.post(`${this.baseUrl}/api/agent/run`, {
      data: { goal: req.goal, context: req.context ?? {} },
      headers: { 'content-type': 'application/json' },
    });
    if (!res.ok()) {
      throw new Error(`Agent run failed: HTTP ${res.status()} ${await res.text()}`);
    }
    return normalize(await res.json());
  }
}

// Normalize a raw agent payload into a complete AgentResponse.
export function normalize(j: any): AgentResponse {
  return {
    runId: j?.runId ?? '',
    success: !!j?.success,
    refused: !!j?.refused,
    message: j?.message ?? '',
    actions: Array.isArray(j?.actions) ? j.actions : [],
    data: j?.data ?? {},
  };
}
