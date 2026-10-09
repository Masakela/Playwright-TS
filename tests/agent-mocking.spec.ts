import { test, expect } from '@playwright/test';

// Network control (cheatsheet #9): mock the agent API so the console UI can be
// verified deterministically, with no live model. We serve a minimal console page
// and intercept POST /api/agent/run.
const CONSOLE_HTML = `<!doctype html><html><body>
  <input data-testid="agent-goal-input" />
  <button data-testid="agent-submit">Run</button>
  <div data-testid="agent-status"></div>
  <pre data-testid="agent-response"></pre>
  <script>
    document.querySelector('[data-testid=agent-submit]').addEventListener('click', async () => {
      const goal = document.querySelector('[data-testid=agent-goal-input]').value;
      const res = await fetch('/api/agent/run', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goal })
      });
      const j = await res.json();
      document.querySelector('[data-testid=agent-status]').textContent =
        j.success ? 'success' : (j.refused ? 'refused' : 'error');
      document.querySelector('[data-testid=agent-response]').textContent = j.message;
    });
  </script>
</body></html>`;

test('console renders mocked agent response', async ({ page }) => {
  await page.route('**/agent', (route) =>
    route.fulfill({ contentType: 'text/html', body: CONSOLE_HTML }));
  await page.route('**/api/agent/run', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        runId: 'run-xyz', success: true, refused: false,
        message: 'User created: john@example.com',
        actions: [{ tool: 'create_user', args: {}, status: 'ok' }],
        data: { userId: 'u-100', email: 'john@example.com' },
      }),
    }));

  await page.goto('https://agent.local/agent');
  await page.getByTestId('agent-goal-input').fill('create a user for John');
  await page.getByTestId('agent-submit').click();

  await expect(page.getByTestId('agent-response')).toContainText('User created: john@example.com');
  await expect(page.getByTestId('agent-status')).toHaveText('success');
});
