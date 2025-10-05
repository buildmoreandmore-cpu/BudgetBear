import { parse } from 'csv-parse/sync';

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  transactionType: 'debit' | 'credit';
  merchantName?: string;
}

/**
 * Normalize merchant names for better categorization
 * Example: "AMAZON.COM*ABC123" -> "Amazon"
 */
export function normalizeMerchantName(description: string): string {
  // Remove common prefixes/suffixes
  const cleaned = description
    .replace(/^(POS|ATM|ACH|DEBIT|CREDIT|ONLINE|RECURRING)\s+/i, '')
    .replace(/\*\d+.*$/, '') // Remove transaction IDs like *123456
    .replace(/#\d+.*$/, '')  // Remove reference numbers
    .replace(/\s+\d{2}\/\d{2}.*$/, '') // Remove dates
    .trim();

  // Common merchant name cleanups
  const merchantPatterns: Record<string, string> = {
    'AMAZON.COM': 'Amazon',
    'AMZN': 'Amazon',
    'WAL-MART': 'Walmart',
    'WALMART': 'Walmart',
    'TARGET': 'Target',
    'STARBUCKS': 'Starbucks',
    'MCDONALD': 'McDonald\'s',
    'UBER': 'Uber',
    'LYFT': 'Lyft',
    'NETFLIX': 'Netflix',
    'SPOTIFY': 'Spotify',
    'APPLE.COM': 'Apple',
    'GOOGLE': 'Google',
  };

  const upper = cleaned.toUpperCase();
  for (const [pattern, name] of Object.entries(merchantPatterns)) {
    if (upper.includes(pattern)) {
      return name;
    }
  }

  return cleaned;
}

/**
 * Parse CSV bank statement
 * Supports multiple common bank CSV formats
 */
export function parseCSV(csvContent: string): ParsedTransaction[] {
  try {
    // Parse CSV - returns array of Record<string, string>
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const transactions: ParsedTransaction[] = [];

    for (const record of records) {
      // Try to identify date column
      const dateValue =
        record['Date'] ||
        record['Transaction Date'] ||
        record['Posted Date'] ||
        record['date'] ||
        record['transaction_date'];

      // Try to identify description column
      const description =
        record['Description'] ||
        record['Transaction Description'] ||
        record['Memo'] ||
        record['description'] ||
        record['memo'] ||
        record['Details'] ||
        '';

      // Try to identify amount columns
      let amount = 0;
      let transactionType: 'debit' | 'credit' = 'debit';

      // Check for separate debit/credit columns
      if (record['Debit'] || record['debit']) {
        amount = Math.abs(parseFloat(record['Debit'] || record['debit'] || '0'));
        transactionType = 'debit';
      } else if (record['Credit'] || record['credit']) {
        amount = Math.abs(parseFloat(record['Credit'] || record['credit'] || '0'));
        transactionType = 'credit';
      } else {
        // Single amount column
        const amountValue =
          record['Amount'] ||
          record['amount'] ||
          record['Transaction Amount'] ||
          '0';

        amount = parseFloat(amountValue.replace(/[^0-9.-]/g, ''));
        transactionType = amount < 0 ? 'debit' : 'credit';
        amount = Math.abs(amount);
      }

      if (!dateValue || !description || amount === 0) {
        continue; // Skip invalid rows
      }

      // Parse date
      let date: Date;
      try {
        date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          // Try MM/DD/YYYY format
          const parts = dateValue.split('/');
          if (parts.length === 3) {
            date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          } else {
            continue; // Skip if can't parse date
          }
        }
      } catch {
        continue;
      }

      transactions.push({
        date,
        description: description.trim(),
        amount,
        transactionType,
        merchantName: normalizeMerchantName(description),
      });
    }

    return transactions;
  } catch (error) {
    console.error('[Transaction Parser] CSV parse error:', error);
    throw new Error('Failed to parse CSV file. Please check the format.');
  }
}

/**
 * Detect if transactions are duplicates
 */
export function isDuplicateTransaction(
  t1: ParsedTransaction,
  t2: ParsedTransaction,
  toleranceDays: number = 1
): boolean {
  // Same amount (must be within half a cent to account for floating point precision)
  const amountDiff = Math.abs(t1.amount - t2.amount);
  if (amountDiff > 0.005) return false;

  // Same type
  if (t1.transactionType !== t2.transactionType) return false;

  // Similar date (within tolerance)
  const daysDiff = Math.abs(t1.date.getTime() - t2.date.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > toleranceDays) return false;

  // Similar description
  const desc1 = t1.description.toLowerCase();
  const desc2 = t2.description.toLowerCase();
  if (desc1 === desc2) return true;

  // Check if one description contains the other
  if (desc1.includes(desc2) || desc2.includes(desc1)) return true;

  return false;
}
