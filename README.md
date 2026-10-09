# Playwright Agent Testing (TypeScript)

A standalone **Playwright + TypeScript** project for **testing AI-agent-based
workflows** - the AI agent is the *system under test*. It ships with a
zero-dependency **reference agent** so the whole thing runs end-to-end locally and
in CI with no external dependencies.

It applies the patterns from three Playwright reference docs (architecture, SDET
framework, intermediate cheatsheet): Page Object Model, custom fixtures, hooks,
separate test data, parameterized tests, multiple environments, API + UI testing,
network control/mocking, and a multi-browser project matrix. See
`AI_AGENT_TESTING.md` and `ARCHITECTURE.md`.

> A Java/TestNG edition of the same approach lives in a separate project.

## Layout

```
playwright.config.ts          projects (chromium/firefox/webkit), reporters (html/json/allure), env baseURL
fixtures/agent.fixtures.ts     custom fixtures: apiContext, agent (client), console (POM)
src/
  config/env.ts                env-driven settings (no hard-coded URLs)
  agent/                       agentClient, agentConsole.page, types
  eval/                        evaluator (property-based), guardrails
  validation/dataQuality.ts    missing / duplicate / source-to-target checks
test-data/                     eval-cases.json, guardrail-cases.json
tests/                         *.spec.ts (offline + live)
agent-server/                  reference AI-agent (the system under test), Node, zero-dep
scripts/                       run-e2e, start-agent, kpi-report
docker-compose.yml             brings the agent up on :8080
.github/workflows/ci.yml       CI: tests -> Allure + HTML reports -> KPIs -> Pages
```

## Run

```bash
npm install
npx playwright install

# Offline only (no agent): logic + mocked-UI specs
npm run test:offline

# End-to-end (starts the agent, runs everything, stops it):
./scripts/run-e2e.sh        # macOS/Linux
.\scripts\run-e2e.ps1       # Windows PowerShell

# Or by hand:
node agent-server/server.js            # or: docker compose up   (http://localhost:8080)
AGENT_BASE_URL=http://localhost:8080 npm test
npm run report                          # open the HTML report
```

Live specs **skip** when `AGENT_BASE_URL` is unset, so `npm test` is green on a
fresh checkout. Prerequisites: Node 18+ and (first run) Playwright browsers.

### Default port is 8787 (not 8080)

The reference agent defaults to **http://localhost:8787** because Jenkins and
Tomcat both grab **8080** on most dev machines - a busy 8080 means the agent
can't bind and the live tests hit the other service (a confusing **HTTP 403**).
Override with `PORT`/`$env:PORT` if 8787 is taken, or if you run the agent by
hand: `PORT=8787 node agent-server/server.js`.

### Behind a corporate proxy?

On managed machines an `HTTP_PROXY`/`HTTPS_PROXY` is often set, and Playwright's
request context will route the **localhost** agent call through it - the proxy then
answers **HTTP 403** and every live spec fails. The project guards against this:
`src/config/env.ts` adds `localhost`/`127.0.0.1`/`::1` to `NO_PROXY` whenever the
agent URL is local, and the `run-e2e` scripts do the same. If you invoke Playwright
some other way and still see a 403, set it yourself first:

```bash
export NO_PROXY=localhost,127.0.0.1,::1   # PowerShell: $env:NO_PROXY="localhost,127.0.0.1,::1"
```

## KPIs

After a run, build the stakeholder dashboard:

```bash
npm run kpi        # reads test-results/results.json -> kpis-out/index.html
```

CI publishes the dashboard, the Allure report, and the Playwright HTML report to
GitHub Pages. See `kpis/README.md`.

## The agent contract

`POST {AGENT_BASE_URL}/api/agent/run` with `{ goal, context }` returns
`{ runId, success, refused, message, actions[], data{} }`. Point `agentClient.ts`
at your real agent to wire it up. Full details in `ARCHITECTURE.md`.

## Patterns implemented (from the three Playwright reference diagrams)

Framework Architecture, SDET Framework, and the Intermediate Cheatsheet — every
technique maps to a concrete file in this project:

| Pattern | Where |
|---|---|
| Page Object Model | `src/agent/agentConsole.page.ts` |
| Custom fixtures | `fixtures/agent.fixtures.ts` (`apiContext`, `agent`, `console`) |
| Hooks / setup–teardown | fixture `use()` (setup before, teardown after) |
| Separate test data | `test-data/eval-cases.json`, `test-data/guardrail-cases.json` |
| Data-driven specs | specs iterate the imported JSON cases |
| Multiple environments | `src/config/env.ts` (`AGENT_BASE_URL`, `EVAL_THRESHOLD`, `AGENT_REPEAT`) |
| API + UI testing | `src/agent/agentClient.ts` (API) + console POM (UI) |
| Network control / mocking | `tests/agent-mocking.spec.ts` (`route.fulfill`) |
| Web-first assertions / auto-wait | `expect(locator)` throughout |
| Cross-browser projects | `playwright.config.ts` — chromium / firefox / webkit matrix |
| Reporting / observability | list + HTML + JSON + Allure; KPI dashboard (`scripts/kpi-report.js`) |
| CI/CD | `.github/workflows/ci.yml` → reports → GitHub Pages |
