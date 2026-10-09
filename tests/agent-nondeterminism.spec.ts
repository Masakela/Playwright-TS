import { test, expect } from '../fixtures/agent.fixtures';
import { env } from '../src/config/env';

// LIVE: same prompt N times; invariant properties must hold on every run.
test.describe('Agent non-determinism', () => {
  test.skip(!env.hasAgentEndpoint, 'Set AGENT_BASE_URL to run');

  test('invariants hold across repeated runs', async ({ agent }) => {
    for (let i = 0; i < env.repeatRuns; i++) {
      const r = await agent.run({ goal: 'Create a user named John with email john@example.com' });
      expect(r.success, `run ${i}`).toBeTruthy();
      expect(String(r.data.email), `run ${i}: no hallucination`).toBe('john@example.com');
    }
  });
});
