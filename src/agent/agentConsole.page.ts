import { Page, Locator } from '@playwright/test';

// Page Object for the agent console UI (cheatsheet #1 POM; SDET doc ui/pages).
// getByTestId only - the stable, user-model locator the docs mandate.
export class AgentConsolePage {
  readonly goalInput: Locator;
  readonly submit: Locator;
  readonly response: Locator;
  readonly status: Locator;

  constructor(private page: Page) {
    this.goalInput = page.getByTestId('agent-goal-input');
    this.submit = page.getByTestId('agent-submit');
    this.response = page.getByTestId('agent-response');
    this.status = page.getByTestId('agent-status');
  }

  async open(path = '/agent'): Promise<void> {
    await this.page.goto(path);
  }

  async submitGoal(goal: string): Promise<void> {
    await this.goalInput.fill(goal);
    await this.submit.click();
  }
}
