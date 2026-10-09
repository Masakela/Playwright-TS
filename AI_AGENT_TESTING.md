# Testing AI Agents ("AI as the system under test")

This project treats an **AI agent** as the thing under test: software that takes a
natural-language goal and performs a workflow, exposed via an API
(`POST /api/agent/run`) and a console UI (`/agent`).

Agent output is **non-deterministic**, so we never assert exact text - we assert
**invariant properties**, measure a **task-success rate** against a golden set, and
check **guardrails** and **data quality**.

## What we test

| Dimension | Idea | Spec |
|-----------|------|------|
| Functional / API->UI | agent completes the workflow; result visible in UI | `agent-functional.spec.ts` |
| Data validation | output complete, no dupes, matches request | `agent-data-validation.spec.ts`, `unit-evaluator.spec.ts` |
| Guardrails | out-of-scope refused; no leak; tool scope | `agent-guardrails.spec.ts`, `unit-evaluator.spec.ts` |
| Non-determinism | invariants hold across repeated runs | `agent-nondeterminism.spec.ts` |
| Eval harness | golden set meets a task-success threshold | `agent-eval-harness.spec.ts` |
| Deterministic UI | mock the agent to verify the console | `agent-mocking.spec.ts` |

## Core ideas

- **Property-based evaluation** (`src/eval/evaluator.ts`) - checks refusal, semantic
  `mustContain`, `requiredDataFields`, and specific `expectedData`; never exact text.
  `successRate(...)` is the metric the harness gates on.
- **Golden datasets** (`test-data/*.json`) - keep cases out of code; re-run them when
  the model or prompt changes - the AI-agent regression pack.
- **Guardrails** (`src/eval/guardrails.ts`) - refuse out-of-scope goals, no leaked
  terms, only allow-listed tools.
- **Data quality** (`src/validation/dataQuality.ts`) - missing fields, duplicate
  keys, source-to-target reconciliation on the records the agent produces.
- **Mocking** (`agent-mocking.spec.ts`) - intercept `POST /api/agent/run` so the UI
  can be verified deterministically with no live model.

## How the three reference docs map in

- **Architecture 2026** - scalable structure; UI + API automation; CI/CD +
  observability (trace/screenshot/video/report); human-in-the-loop.
- **SDET framework** - api/clients, ui/pages, fixtures, utils, separate test data;
  stable `getByTestId` locators, data in files, assert the body, mock at the network.
- **Intermediate cheatsheet** - POM, fixtures, hooks, storage state (BrowserContext),
  test data, parameterized, multiple environments, API + UI, network control,
  projects/browsers.

## Wiring a real agent

```bash
AGENT_BASE_URL=https://your-agent npm test
```

Adjust `src/agent/agentClient.ts` and the `AgentResponse` type if your agent's API
differs; everything keys off that shape.
