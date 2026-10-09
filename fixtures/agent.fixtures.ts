import { test as base, APIRequestContext, request } from '@playwright/test';
import { AgentClient } from '../src/agent/agentClient';
import { AgentConsolePage } from '../src/agent/agentConsole.page';
import { env } from '../src/config/env';

// Custom fixtures (cheatsheet #2): reusable agent API client + console POM, with
// no duplicated setup across specs.
type AgentFixtures = {
  apiContext: APIRequestContext;
  agent: AgentClient;
  console: AgentConsolePage;
};

export const test = base.extend<AgentFixtures>({
  apiContext: async ({}, use) => {
    const ctx = await request.newContext({ baseURL: env.baseUrl });
    await use(ctx);
    await ctx.dispose();
  },
  agent: async ({ apiContext }, use) => {
    await use(new AgentClient(apiContext, env.baseUrl));
  },
  console: async ({ page }, use) => {
    await use(new AgentConsolePage(page));
  },
});

export { expect } from '@playwright/test';
