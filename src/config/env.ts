// Environment + run settings, read from env vars (cheatsheet #7). When
// AGENT_BASE_URL is unset, live specs skip via test.skip(...).
export const env = {
  baseUrl: process.env.AGENT_BASE_URL || 'https://agent.local',
  hasAgentEndpoint: !!process.env.AGENT_BASE_URL,
  evalThreshold: process.env.EVAL_THRESHOLD ? Number(process.env.EVAL_THRESHOLD) : 0.8,
  repeatRuns: process.env.AGENT_REPEAT ? Number(process.env.AGENT_REPEAT) : 3,
};
