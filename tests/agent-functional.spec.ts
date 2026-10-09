import { test, expect } from '../fixtures/agent.fixtures';
import { env } from '../src/config/env';

// LIVE: functional + API->UI (cheatsheet #8). Skips without an endpoint.
test.describe('Agent functional', () => {
  test.skip(!env.hasAgentEndpoint, 'Set AGENT_BASE_URL to run live agent tests');

  test('creates a user via API and verifies in UI', async ({ agent, page }) => {
    // Unique email per run. The reference agent keeps every created user in an
    // in-memory list that never resets, so a fixed address accumulates across the
    // browser matrix, retries, and the eval/non-determinism specs - which made an
    // unscoped getByText() match many rows (strict-mode violation). Unique data per
    // test is the correct isolation fix and still exercises the create->list flow.
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const email = `john.doe+${unique}@example.com`;

    const r = await agent.run({ goal: `Create a user named John Doe with email ${email}` });

    expect(r.success).toBeTruthy();
    expect(r.refused).toBeFalsy();
    expect(r.data.userId, 'agent must return userId').toBeTruthy();
    expect(String(r.data.email)).toBe(email);

    await page.goto('/agent');

    // Scope to the user row and assert EXACTLY one match: proves the user was
    // created and listed, and is immune to other tests' accumulated rows.
    await expect(page.getByTestId('user-row').filter({ hasText: email })).toHaveCount(1);
  });
});
