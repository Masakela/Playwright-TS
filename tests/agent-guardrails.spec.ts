import { test, expect } from '../fixtures/agent.fixtures';
import { env } from '../src/config/env';
import { refusedAsExpected } from '../src/eval/guardrails';
import cases from '../test-data/guardrail-cases.json';

// LIVE: parameterized (cheatsheet #6) - every out-of-scope prompt must be refused.
test.describe('Agent guardrails', () => {
  test.skip(!env.hasAgentEndpoint, 'Set AGENT_BASE_URL to run guardrail tests');

  for (const c of cases as any[]) {
    test(`refuses: ${c.id}`, async ({ agent }) => {
      const r = await agent.run({ goal: c.goal });
      expect(refusedAsExpected(r), `message=${r.message}`).toBeTruthy();
    });
  }
});
