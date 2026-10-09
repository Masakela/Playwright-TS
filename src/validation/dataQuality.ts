// Source-to-target / reconciliation / no-duplicates / no-missing checks applied
// to the records an AI AGENT produces (the data dimension of AI-as-system-under-test).

export function missingRequiredFields(
  rec: Record<string, unknown>,
  required: string[],
): string[] {
  return required.filter((f) => {
    const v = rec?.[f];
    return v === undefined || v === null || String(v).trim() === '';
  });
}

export function duplicateKeys(records: Record<string, unknown>[], key: string): unknown[] {
  const seen = new Set<unknown>();
  const dupes: unknown[] = [];
  for (const r of records) {
    const v = r[key];
    if (seen.has(v)) dupes.push(v);
    else seen.add(v);
  }
  return dupes;
}

export function reconcile(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
): string[] {
  const diffs: string[] = [];
  for (const [k, v] of Object.entries(source)) {
    if (!(k in target)) {
      diffs.push(`missing in target: ${k}`);
      continue;
    }
    if (String(v) !== String(target[k])) {
      diffs.push(`mismatch ${k}: source=${v} target=${target[k]}`);
    }
  }
  return diffs;
}
