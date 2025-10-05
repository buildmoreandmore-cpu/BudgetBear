import { parse } from 'csv-parse/sync';
import * as pdfParse from 'pdf-parse';

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

/**
 * Parse PDF bank statement
 * Extracts text and attempts to parse transactions from common bank formats
 */
export async function parsePDF(pdfBuffer: Buffer): Promise<ParsedTransaction[]> {
  try {
    // @ts-expect-error - pdf-parse has unusual module structure
    const pdf = pdfParse.default || pdfParse;
    const data = await pdf(pdfBuffer);
    const text = data.text;

    // Try to extract transactions from the text
    // This is a heuristic approach - different banks format PDFs differently
    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Common patterns for transaction lines:
    // MM/DD/YYYY Description Amount
    // MM/DD Description $Amount
    // Date Description Debit Credit

    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,  // MM/DD/YYYY or MM/DD/YY
      /(\d{1,2}-\d{1,2}-\d{2,4})/,   // MM-DD-YYYY
      /(\d{4}-\d{1,2}-\d{1,2})/,     // YYYY-MM-DD
    ];

    const amountPattern = /\$?([\d,]+\.\d{2})/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Try to find date in the line
      let dateMatch = null;
      let dateStr = '';
      for (const pattern of datePatterns) {
        dateMatch = line.match(pattern);
        if (dateMatch) {
          dateStr = dateMatch[1];
          break;
        }
      }

      if (!dateMatch) continue;

      // Extract amounts from the line
      const amounts = line.match(new RegExp(amountPattern, 'g'));
      if (!amounts || amounts.length === 0) continue;

      // Extract description (text between date and amount)
      const dateIndex = line.indexOf(dateStr);
      const lastAmountIndex = line.lastIndexOf(amounts[amounts.length - 1]);
      const description = line.substring(dateIndex + dateStr.length, lastAmountIndex).trim();

      if (!description) continue;

      // Parse date
      let date: Date;
      try {
        const parts = dateStr.split(/[/-]/);
        if (parts.length === 3) {
          // Determine format based on first part
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          } else {
            // MM/DD/YYYY or MM-DD-YYYY
            const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
            date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
          }

          if (isNaN(date.getTime())) continue;
        } else {
          continue;
        }
      } catch {
        continue;
      }

      // Determine transaction type and amount
      // If there are 2 amounts, likely Debit and Credit columns
      let amount: number;
      let transactionType: 'debit' | 'credit';

      if (amounts.length >= 2) {
        const debitAmount = parseFloat(amounts[0].replace(/[$,]/g, ''));
        const creditAmount = parseFloat(amounts[1].replace(/[$,]/g, ''));

        if (debitAmount > 0 && creditAmount === 0) {
          amount = debitAmount;
          transactionType = 'debit';
        } else if (creditAmount > 0 && debitAmount === 0) {
          amount = creditAmount;
          transactionType = 'credit';
        } else {
          // Use the last amount
          amount = parseFloat(amounts[amounts.length - 1].replace(/[$,]/g, ''));
          transactionType = 'debit'; // Default to debit
        }
      } else {
        amount = parseFloat(amounts[0].replace(/[$,]/g, ''));
        // Check if there's a negative sign or parentheses
        if (line.includes('-') || line.includes('(')) {
          transactionType = 'debit';
        } else {
          transactionType = 'credit';
        }
      }

      if (amount === 0 || isNaN(amount)) continue;

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
    console.error('[Transaction Parser] PDF parse error:', error);
    throw new Error('Failed to parse PDF file. Please check the format.');
  }
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseStatement(
  fileBuffer: Buffer,
  fileType: 'csv' | 'pdf'
): Promise<ParsedTransaction[]> {
  if (fileType === 'csv') {
    const content = fileBuffer.toString('utf-8');
    return parseCSV(content);
  } else if (fileType === 'pdf') {
    return await parsePDF(fileBuffer);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}
