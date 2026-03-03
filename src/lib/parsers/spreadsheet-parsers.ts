import { normalizeTransaction, validateTransaction } from './validators';

export interface ParsedRow {
  row: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

export function parseCSV(csv: string, accountId: string): ParsedRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const results: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const rawRow: Record<string, unknown> = { account_id: accountId };

    headers.forEach((h, idx) => {
      rawRow[h] = values[idx]?.trim() || null;
    });

    const normalized = normalizeTransaction(rawRow);
    const { valid, errors } = validateTransaction(normalized);
    results.push({ row: normalized, valid, errors });
  }

  return results;
}

export function parseSkandiaCSV(csv: string, accountId: string): ParsedRow[] {
  // Skandia-specific column mapping
  return parseCSV(csv, accountId);
}
