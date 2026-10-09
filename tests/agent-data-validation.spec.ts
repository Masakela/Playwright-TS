import { test, expect } from '../fixtures/agent.fixtures';
import { env } from '../src/config/env';
import { missingRequiredFields } from '../src/validation/dataQuality';

// LIVE: the record the agent creates must have all required fields and match the request.
test.describe('Agent data validation', () => {
  test.skip(!env.hasAgentEndpoint, 'Set AGENT_BASE_URL to run');

  test('created record is complete and matches the request', async ({ agent }) => {
    const r = await agent.run({ goal: 'Create a user named John with email john@example.com' });
    const missing = missingRequiredFields(r.data, ['userId', 'email', 'name']);
    expect(missing, `missing: ${missing.join(', ')}`).toHaveLength(0);
    expect(String(r.data.email)).toBe('john@example.com');
  });
});
