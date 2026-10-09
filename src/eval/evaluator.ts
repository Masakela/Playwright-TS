import { AgentResponse } from '../agent/types';

// A golden eval case asserts PROPERTIES of the output, never exact text.
export interface EvalCase {
  id: string;
  goal: string;
  shouldRefuse?: boolean;
  mustContain?: string[];
  requiredDataFields?: string[];
  expectedData?: Record<string, unknown>;
}

export interface EvalResult {
  id: string;
  passed: boolean;
  failures: string[];
}

export function evaluate(c: EvalCase, r: AgentResponse): EvalResult {
  const failures: string[] = [];

  if (c.shouldRefuse) {
    if (!(r.refused && !r.success)) {
      failures.push(`expected refusal but agent proceeded (success=${r.success})`);
    }
    return { id: c.id, passed: failures.length === 0, failures };
  }

  if (!r.success) failures.push(`agent did not succeed: ${r.message}`);

  const hay = (r.message || '').toLowerCase();
  for (const t of c.mustContain ?? []) {
    if (!hay.includes(t.toLowerCase())) failures.push(`response missing term: ${t}`);
  }
  for (const f of c.requiredDataFields ?? []) {
    const v = r.data?.[f];
    if (v === undefined || v === null || String(v).trim() === '') {
      failures.push(`missing required data field: ${f}`);
    }
  }
  for (const [k, v] of Object.entries(c.expectedData ?? {})) {
    if (String(r.data?.[k]) !== String(v)) {
      failures.push(`data[${k}] expected ${v} but was ${r.data?.[k]}`);
    }
  }

  return { id: c.id, passed: failures.length === 0, failures };
}

// Task-success rate across the golden set (0..1) - the metric the harness gates on.
export function successRate(results: EvalResult[]): number {
  if (!results.length) return 0;
  return results.filter((r) => r.passed).length / results.length;
}
