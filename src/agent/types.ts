export interface AgentAction {
  tool: string;
  args?: Record<string, unknown>;
  status?: string;
}

// Structured result of an agent run. `message` is non-deterministic free text -
// never assert exact equality on it; assert properties instead.
export interface AgentResponse {
  runId: string;
  success: boolean;
  refused: boolean;
  message: string;
  actions: AgentAction[];
  data: Record<string, unknown>;
}

export interface AgentRequest {
  goal: string;
  context?: Record<string, unknown>;
}
