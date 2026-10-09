import { test, expect } from '../fixtures/agent.fixtures';
import { env } from '../src/config/env';

// LIVE: functional + API->UI (cheatsheet #8). Skips without an endpoint.
test.describe('Agent functional', () => {
  test.skip(!env.hasAgentEndpoint, 'Set AGENT_BASE_URL to run live agent tests');

  test('creates a user via API and verifies in UI', async ({ agent, page }) => {
    const r = await agent.run({ goal: 'Create a user named John Doe with email john@example.com' });

    expect(r.success).toBeTruthy();
    expect(r.refused).toBeFalsy();
    expect(r.data.userId, 'agent must return userId').toBeTruthy();
    expect(String(r.data.email)).toBe('john@example.com');

    await page.goto('/agent');
    await expect(page.getByText('john@example.com')).toBeVisible();
  });
});
