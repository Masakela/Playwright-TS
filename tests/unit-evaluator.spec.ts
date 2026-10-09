import { test, expect } from '@playwright/test';
import { evaluate, successRate, EvalCase } from '../src/eval/evaluator';
import { missingRequiredFields, duplicateKeys, reconcile } from '../src/validation/dataQuality';
import { refusedAsExpected, leakedTerms, outOfScopeTools } from '../src/eval/guardrails';
import { AgentResponse } from '../src/agent/types';

// Offline logic tests - no browser, no live agent. Proves the eval / data-quality /
// guardrail logic independently of the model.
const ok = (data: Record<string, unknown>, message = 'done'): AgentResponse => ({
  runId: 'r', success: true, refused: false, message, actions: [], data,
});

test.describe('Evaluator', () => {
  test('passes when properties hold', () => {
    const c: EvalCase = {
      id: 'c1', goal: 'create user', mustContain: ['created'],
      requiredDataFields: ['userId', 'email'], expectedData: { email: 'john@example.com' },
    };
    const r = ok({ userId: 'u-1', email: 'john@example.com' }, 'User created successfully');
    expect(evaluate(c, r).passed).toBeTruthy();
  });

  test('fails on missing required field', () => {
    const c: EvalCase = { id: 'c2', goal: 'x', requiredDataFields: ['email'] };
    expect(evaluate(c, ok({ userId: 'u-1' })).passed).toBeFalsy();
  });

  test('refusal case passes only when refused', () => {
    const c: EvalCase = { id: 'c3', goal: 'delete prod', shouldRefuse: true };
    const refused: AgentResponse = { runId: 'r', success: false, refused: true, message: 'no', actions: [], data: {} };
    const proceeded: AgentResponse = { runId: 'r', success: true, refused: false, message: 'done', actions: [], data: {} };
    expect(evaluate(c, refused).passed).toBeTruthy();
    expect(evaluate(c, proceeded).passed).toBeFalsy();
  });

  test('success rate', () => {
    expect(successRate([
      { id: 'a', passed: true, failures: [] },
      { id: 'b', passed: false, failures: ['x'] },
    ])).toBe(0.5);
  });
});

test.describe('Data quality', () => {
  test('missing fields', () => { expect(missingRequiredFields({ a: '' }, ['a', 'b'])).toEqual(['a', 'b']); });
  test('duplicates', () => { expect(duplicateKeys([{ id: 1 }, { id: 2 }, { id: 1 }], 'id')).toEqual([1]); });
  test('reconcile', () => { expect(reconcile({ e: 'x' }, { e: 'y' }).length).toBe(1); });
});

test.describe('Guardrails', () => {
  test('refusal detected', () => {
    expect(refusedAsExpected({ runId: 'r', success: false, refused: true, message: '', actions: [], data: {} })).toBeTruthy();
  });
  test('leaked terms found', () => {
    expect(leakedTerms(ok({}, 'the password is hunter2'), ['password']).length).toBe(1);
  });
  test('out-of-scope tools', () => {
    expect(outOfScopeTools(
      { runId: 'r', success: true, refused: false, message: '', actions: [{ tool: 'delete_db' }], data: {} },
      ['create_user'],
    )).toEqual(['delete_db']);
  });
});
