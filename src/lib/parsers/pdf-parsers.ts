export interface PDFParseResult {
  transactions: Array<Record<string, unknown>>;
  metadata: {
    account_id?: string;
    period?: string;
    total_value?: number;
    capital?: number;
  };
}

// PDF parsing requires server-side pdf-parse library
// This is a stub — actual PDF parsing is done by Python backend
export async function parseSkandiaStatement(
  buffer: Buffer,
  accountId: string
): Promise<PDFParseResult> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfParse = await import('pdf-parse').catch(() => null);
    if (!pdfParse) {
      return { transactions: [], metadata: { account_id: accountId } };
    }

    const data = await pdfParse.default(buffer);
    const text = data.text;

    const transactions: Array<Record<string, unknown>> = [];
    const lines = text.split('\n').filter((l: string) => l.trim());

    // Simple date-amount pattern matching
    const dateAmountPattern = /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)/;

    for (const line of lines) {
      const match = line.match(dateAmountPattern);
      if (match) {
        const [, date, description, amountStr] = match;
        const amount = parseFloat(amountStr.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(amount)) {
          transactions.push({
            account_id: accountId,
            transaction_date: date.split('/').reverse().join('-'), // DD/MM/YYYY → YYYY-MM-DD
            description,
            amount,
            currency: 'COP',
            transaction_type: amount > 0 ? 'deposit' : 'withdrawal',
          });
        }
      }
    }

    return { transactions, metadata: { account_id: accountId } };
  } catch {
    return { transactions: [], metadata: { account_id: accountId } };
  }
}
