// Environment + run settings, read from env vars (cheatsheet #7). When
// AGENT_BASE_URL is unset, live specs skip via test.skip(...).
const baseUrl = process.env.AGENT_BASE_URL || 'https://agent.local';

// Corporate-proxy guard: Playwright's request context honors HTTP(S)_PROXY and,
// on managed machines, routes even a localhost call through the proxy (which
// commonly answers 403). Make local hosts bypass the proxy. No-op elsewhere.
if (/^https?:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:|\/|$)/i.test(baseUrl)) {
  const locals = ['localhost', '127.0.0.1', '::1'];
  const existing = (process.env.NO_PROXY || process.env.no_proxy || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const merged = Array.from(new Set([...existing, ...locals])).join(',');
  process.env.NO_PROXY = merged;
  process.env.no_proxy = merged;
}

export const env = {
  baseUrl,
  hasAgentEndpoint: !!process.env.AGENT_BASE_URL,
  evalThreshold: process.env.EVAL_THRESHOLD ? Number(process.env.EVAL_THRESHOLD) : 0.8,
  repeatRuns: process.env.AGENT_REPEAT ? Number(process.env.AGENT_REPEAT) : 3,
};
