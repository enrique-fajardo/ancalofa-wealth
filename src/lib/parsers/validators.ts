export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTransaction(row: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!row.account_id) errors.push('account_id is required');
  if (!row.transaction_date && !row.date) errors.push('transaction_date is required');
  if (row.amount === undefined || row.amount === null) errors.push('amount is required');
  if (!row.transaction_type && !row.type) errors.push('transaction_type is required');
  if (row.currency && !['COP', 'USD'].includes(String(row.currency))) {
    errors.push('currency must be COP or USD');
  }

  return { valid: errors.length === 0, errors };
}

export function normalizeTransaction(row: Record<string, unknown>): Record<string, unknown> {
  return {
    account_id: row.account_id,
    transaction_type: row.transaction_type || row.type || 'deposit',
    amount: Math.abs(Number(row.amount) || 0),
    currency: String(row.currency || 'COP').toUpperCase(),
    transaction_date: String(row.transaction_date || row.date || ''),
    symbol: row.symbol || null,
    description: row.description || null,
    notes: row.notes || null,
  };
}
