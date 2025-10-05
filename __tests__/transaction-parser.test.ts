import { parseCSV, normalizeMerchantName, isDuplicateTransaction, parsePDF, parseStatement, convertPdfToCSV } from '@/lib/transaction-parser';

describe('Transaction Parser', () => {
  describe('parseCSV', () => {
    it('should parse a basic CSV with Date, Description, and Amount columns', () => {
      const csv = `Date,Description,Amount
01/15/2025,Amazon.com,50.00
01/16/2025,Starbucks,-5.50`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: expect.any(Date),
        description: 'Amazon.com',
        amount: 50,
        transactionType: 'credit',
        merchantName: 'Amazon',
      });
    });

    it('should handle separate Debit and Credit columns', () => {
      const csv = `Date,Description,Debit,Credit
01/15/2025,Walmart,100.00,
01/16/2025,Paycheck,,2000.00`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
      expect(result[0].transactionType).toBe('debit');
      expect(result[0].amount).toBe(100);
      expect(result[1].transactionType).toBe('credit');
      expect(result[1].amount).toBe(2000);
    });

    it('should skip rows with missing required data', () => {
      const csv = `Date,Description,Amount
01/15/2025,Valid Transaction,50.00
,Missing Date,25.00
01/17/2025,,30.00
01/18/2025,No Amount,`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Valid Transaction');
    });

    it('should handle different date formats', () => {
      const csv = `Transaction Date,Description,Amount
2025-01-15,Test,50.00`;

      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBeInstanceOf(Date);
    });
  });

  describe('normalizeMerchantName', () => {
    it('should normalize Amazon transactions', () => {
      expect(normalizeMerchantName('AMAZON.COM*ABC123')).toBe('Amazon');
      expect(normalizeMerchantName('AMZN MKTP US*456789')).toBe('Amazon');
    });

    it('should normalize Walmart transactions', () => {
      expect(normalizeMerchantName('WAL-MART #1234')).toBe('Walmart');
      expect(normalizeMerchantName('WALMART.COM')).toBe('Walmart');
    });

    it('should remove common prefixes', () => {
      expect(normalizeMerchantName('POS STARBUCKS')).toBe('Starbucks');
      expect(normalizeMerchantName('DEBIT CARD PURCHASE TARGET')).toBe('Target');
    });

    it('should handle unknown merchants', () => {
      expect(normalizeMerchantName('LOCAL COFFEE SHOP')).toBe('LOCAL COFFEE SHOP');
    });
  });

  describe('isDuplicateTransaction', () => {
    const transaction1 = {
      date: new Date('2025-01-15'),
      description: 'Amazon.com',
      amount: 50.00,
      transactionType: 'debit' as const,
      merchantName: 'Amazon',
    };

    it('should detect exact duplicates', () => {
      const transaction2 = { ...transaction1 };
      expect(isDuplicateTransaction(transaction1, transaction2)).toBe(true);
    });

    it('should detect duplicates with same date and amount', () => {
      const transaction2 = {
        ...transaction1,
        description: 'AMAZON.COM*ABC123', // Different description
      };
      expect(isDuplicateTransaction(transaction1, transaction2)).toBe(true);
    });

    it('should not flag different amounts as duplicates', () => {
      const transaction2 = {
        ...transaction1,
        amount: 49.99,
      };
      expect(isDuplicateTransaction(transaction1, transaction2)).toBe(false);
    });

    it('should not flag different dates outside tolerance as duplicates', () => {
      const transaction2 = {
        ...transaction1,
        date: new Date('2025-01-20'),
      };
      expect(isDuplicateTransaction(transaction1, transaction2)).toBe(false);
    });

    it('should detect duplicates within date tolerance', () => {
      const transaction2 = {
        ...transaction1,
        date: new Date('2025-01-16'), // 1 day apart
      };
      expect(isDuplicateTransaction(transaction1, transaction2, 1)).toBe(true);
    });
  });

  describe('convertPdfToCSV', () => {
    it('should convert PDF text to CSV format using Claude AI', async () => {
      // Skip if no API key is set
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping convertPdfToCSV test - ANTHROPIC_API_KEY not set');
        return;
      }

      const mockPdfText = `
Bank Statement - January 2025

Transaction History:
01/15/2025  Amazon.com Purchase           $50.00
01/16/2025  Starbucks Coffee              $5.50
01/17/2025  Salary Deposit             $2,000.00
01/18/2025  Rent Payment                 $1,200.00

Ending Balance: $2,844.50
      `.trim();

      const csvResult = await convertPdfToCSV(mockPdfText);

      // Verify it returns CSV format
      expect(csvResult).toContain('Date');
      expect(csvResult).toContain('Description');
      expect(csvResult).toContain('Amount');

      // Verify it contains some transaction data
      expect(csvResult).toContain('Amazon');
      expect(csvResult).toContain('Starbucks');
    }, 30000); // 30 second timeout for API call

    it('should throw error if ANTHROPIC_API_KEY is not set', async () => {
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const mockPdfText = 'Some bank statement text';

      await expect(convertPdfToCSV(mockPdfText)).rejects.toThrow(
        'ANTHROPIC_API_KEY environment variable is not set'
      );

      // Restore original key
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });
  });

  describe('parsePDF', () => {
    it('should parse PDF using AI conversion to CSV', async () => {
      // Skip if no API key is set
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping parsePDF test - ANTHROPIC_API_KEY not set');
        return;
      }

      // Note: This test would need a real PDF buffer in a real scenario
      // For now, we're just testing the error handling
      const invalidBuffer = Buffer.from('invalid pdf');

      await expect(parsePDF(invalidBuffer)).rejects.toThrow();
    }, 30000);

    it('should handle PDF parsing errors gracefully', async () => {
      const invalidBuffer = Buffer.from('invalid pdf');

      await expect(parsePDF(invalidBuffer)).rejects.toThrow();
    });
  });

  describe('parseStatement', () => {
    it('should route to parseCSV for csv file type', async () => {
      const csvBuffer = Buffer.from('Date,Description,Amount\n01/15/2025,Test,100.00');
      const result = await parseStatement(csvBuffer, 'csv');

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
    });

    it('should reject unsupported file types', async () => {
      const buffer = Buffer.from('test');

      await expect(
        parseStatement(buffer, 'xlsx' as 'csv')
      ).rejects.toThrow('Unsupported file type');
    });
  });
});
