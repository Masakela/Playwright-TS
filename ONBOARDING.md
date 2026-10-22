# Onboarding — adopt this on a new project in under an hour (TypeScript)

A step-by-step runbook for pointing this Playwright/TypeScript skeleton at a real
application and getting a green suite, a KPI dashboard, and CI reporting quickly.

> Rule of thumb: get the **offline** suite green first (zero setup), then point it at
> the app, then wire CI. Each step is independently useful.

## 0 · Prerequisites (~5 min)
- Node 18+ and Git
- (For live/browser runs) `npx playwright install --with-deps`

## 1 · Clone & install (~5 min)
```bash
git clone <this-repo> && cd playwright-agent-ts
npm install
npx playwright install
```

## 2 · Prove it works — offline, no app needed (~2 min)
```bash
npm run test:offline     # evaluator/guardrail/mocked-UI specs — green with nothing running
```
Green here means the framework is sound before you touch the client's app.

## 3 · Point it at the real application (~10 min)
The base URL is the only required change — it is read from the environment, never hard-coded:
```bash
cp .env.example .env      # then edit:
#   AGENT_BASE_URL=https://the-app-under-test.example.com
```
- Testing a conventional web app? Set the base URL and adapt the page objects in `src/` / `tests/` to the app's pages.
- Testing an AI/agent feature? Keep the agent contract in `src/agent/` and change `agentClient.ts` to match the real endpoint shape.

## 4 · Run against the app (~5 min)
```bash
AGENT_BASE_URL=https://the-app.example.com npx playwright test
```
Traces, screenshots, and video are captured on failure automatically.

## 5 · Build the stakeholder dashboard (~2 min)
```bash
npm run kpi              # reads test-results/results.json → kpis-out/index.html
# open kpis-out/index.html
```
Donut pass-rate, suite drill-down, requirement traceability, and run-history trend.

## 6 · Wire CI + published dashboard (~10 min)
- Copy `.github/workflows/ci.yml` (already in the repo) — it runs the suite, builds the
  dashboard, and deploys to GitHub Pages on every push.
- In GitHub: **Settings → Pages → Source: GitHub Actions**.

## 7 · (Optional) Push results to their tracker (~10 min)
Set the relevant secrets and run the importer — see `INTEGRATIONS.md`:
```bash
node scripts/import-results.js xray     --junit test-results/junit.xml
node scripts/import-results.js testrail --junit test-results/junit.xml --create-missing
# preview with no credentials:
npm run import:dry
```

## 8 · Turn on traceability (ongoing)
Name a test with a requirement id and it appears in the dashboard's traceability table,
linked to its result:
```ts
test('REQ-012 applies discount code', async ({ page }) => { /* ... */ });
```

---
**Delivered in order:** green framework → app wired → dashboard → CI → tracker → traceability.
Stop at whatever depth the engagement needs.
