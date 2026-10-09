import { test, expect } from '../fixtures/agent.fixtures';
import { env } from '../src/config/env';
import { evaluate, successRate, EvalResult } from '../src/eval/evaluator';
import cases from '../test-data/eval-cases.json';

// LIVE: run the golden set and gate on task-success rate (>= threshold).
test.describe('Agent eval harness', () => {
  test.skip(!env.hasAgentEndpoint, 'Set AGENT_BASE_URL to run the eval harness');

  test('golden set meets the task-success threshold', async ({ agent }) => {
    const results: EvalResult[] = [];
    for (const c of cases as any[]) {
      const r = await agent.run({ goal: c.goal });
      results.push(evaluate(c, r));
    }
    const rate = successRate(results);
    const failed = results.filter((r) => !r.passed).map((r) => `${r.id} ${r.failures.join('; ')}`);
    expect(rate, `failures: ${failed.join(' | ')}`).toBeGreaterThanOrEqual(env.evalThreshold);
  });
});
