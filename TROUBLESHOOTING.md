# Playwright Agent TS — Run & Troubleshooting Runbook

Project: `C:\QA Skeleton Projects\portfolio\playwright-agent-ts`
Stack: Playwright + TypeScript (`@playwright/test`), zero-dependency Node reference agent, KPI dashboard.
Last verified green: 2026-10-09.

This is the record of getting the suite running locally end-to-end, what broke, and
how each problem was diagnosed and fixed — so a future run (or a teammate) can skip
the detective work.

---

## 1. Happy path — run it

```powershell
cd "C:\QA Skeleton Projects\portfolio\playwright-agent-ts"
powershell -ExecutionPolicy Bypass -File scripts\run-e2e.ps1
Invoke-Item .\kpis-out\index.html
```

`run-e2e.ps1` does the whole loop: starts the bundled agent on `http://localhost:8787`,
installs browsers if needed, runs the Playwright suite, then builds the KPI dashboard
at `kpis-out\index.html`. First run only, it will `npm install` and
`npx playwright install` automatically.

Prerequisites: Node 18+. No external services — the agent is bundled in `agent-server/`.

Offline-only run (logic + mocked UI, no agent needed):

```powershell
npm run test:offline
```

Rebuild just the dashboard from the last run:

```powershell
npm run kpi
Invoke-Item .\kpis-out\index.html
```

---

## 2. Issues we hit and how they were solved

### 2.1 Live tests failed with HTTP 403

**Symptom.** 21 of 54 tests failed; the error was
`Agent run failed: HTTP 403` thrown from `src/agent/agentClient.ts`.

**What it was NOT.** We first suspected a corporate proxy, but
`$env:HTTP_PROXY`, `$env:HTTPS_PROXY`, and `npm config get proxy` were all empty —
so no proxy was in the path.

**Root cause.** Another service was already listening on port **8080**, so the Node
agent never bound to it and the tests were POSTing to that other service, which
answered 403. On this machine the squatter was **Jenkins** (it also runs on 8080).

**Diagnosis commands.**

```powershell
# Who is listening on 8080? Note the PID in the last column.
netstat -ano | findstr :8080

# What answers on 8080? A healthy agent returns {"status":"ok"};
# anything else (a redirect, a 403, vendor headers) means it is NOT our agent.
curl.exe -s -i http://localhost:8080/health
```

(The `/health` response showed Jenkins headers — `usage.jenkins.io` in the CSP and a
redirect to `/health/` — confirming Jenkins owned the port.)

**Fix.** Run the agent on a free port. The script honors `$env:PORT`:

```powershell
$env:PORT = "8787"
powershell -ExecutionPolicy Bypass -File scripts\run-e2e.ps1
```

This is now the **default** in `run-e2e.ps1` (port 8787), so you don't need to set it
by hand anymore. If 8787 is ever taken too, set `$env:PORT` to anything free.

**Recognize it again.** A 403 (or any non-JSON response) from a local server that
should return JSON almost always means "something else is on that port," not a bug in
your code. Check `netstat` first.

### 2.2 Strict-mode violation — `getByText(...)` matched many elements

**Symptom.**
`strict mode violation: getByText('john@example.com') resolved to 18 elements`
in `tests/agent-functional.spec.ts`.

**Root cause.** The reference agent keeps every created user in an in-memory list that
never resets. The functional test used a **fixed** email, and across the 3-browser
matrix, retries, and the other specs that also create "John," the console listed many
identical rows. Playwright's strict mode refuses to act when a locator matches more
than one element.

**Fix.** Use **unique test data per run** and a **scoped, count-based** assertion.
In `tests/agent-functional.spec.ts`:

```ts
const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const email = `john.doe+${unique}@example.com`;
// ... create the user with that email ...
await expect(page.getByTestId('user-row').filter({ hasText: email })).toHaveCount(1);
```

**Why it works.** A unique email means exactly one row can match, and scoping to
`user-row` + `toHaveCount(1)` proves the user was created and listed without tripping
on data left behind by other tests. This is standard test-data isolation.

**Recognize it again.** "resolved to N elements" = your locator isn't unique. Either
scope it (`.filter({ hasText })`, `.first()`, a `data-testid`) or make the underlying
data unique.

### 2.3 Corporate-proxy guard (preventive)

Even though no proxy was set on this machine, Playwright's request context *does* honor
`HTTP_PROXY`/`HTTPS_PROXY`, and on a managed machine it will route even a `localhost`
call through the proxy (which commonly answers 403). To make the project safe anywhere,
`src/config/env.ts` adds `localhost,127.0.0.1,::1` to `NO_PROXY` whenever the agent URL
is local, and the run scripts do the same.

If you ever invoke Playwright a different way and see a localhost 403, set it yourself:

```powershell
$env:NO_PROXY = "localhost,127.0.0.1,::1"; $env:no_proxy = $env:NO_PROXY
```

### 2.4 Browsers not installed (first-run only)

`playwright.config.ts` runs three engines (chromium/firefox/webkit). The run script now
does `npx playwright install` (all three) instead of just chromium, so a fresh clone
won't fail firefox/webkit with "browser executable doesn't exist." If you hit that, run:

```powershell
npx playwright install
```

---

## 3. Command glossary

| Command | What it does | When to use |
|---|---|---|
| `scripts\run-e2e.ps1` | Start agent (8787) → run suite → build dashboard | Normal full run |
| `npm run test:offline` | Logic + mocked-UI specs only, no agent | Quick check without the agent |
| `npm run kpi` | Rebuild `kpis-out\index.html` from last results | See the dashboard again |
| `npx playwright show-report` | Open the HTML report with per-test traces/screenshots | Diagnosing a failure |
| `npx playwright install` | Download chromium/firefox/webkit | First run or "executable doesn't exist" |
| `netstat -ano \| findstr :8787` | Show what's on the port (PID in last column) | Suspected port collision |
| `curl.exe -s -i http://localhost:8787/health` | Check the agent is up and is ours (expects `{"status":"ok"}`) | Live tests can't reach the agent |
| `$env:PORT = "NNNN"` | Override the agent/test port for this shell | Port 8787 is taken |
| `$env:NO_PROXY = "localhost,127.0.0.1,::1"` | Bypass a proxy for localhost | Localhost 403 behind a proxy |

---

## 4. Push changes

```powershell
cd "C:\QA Skeleton Projects\portfolio\playwright-agent-ts"
git add -A
git commit -m "..."
git push
```

After pushing, enable **Settings → Pages → Source: GitHub Actions** in the GitHub repo
to publish the dashboard, Allure report, and Playwright HTML report to a shareable URL.
