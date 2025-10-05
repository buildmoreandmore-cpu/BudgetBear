import { parseCSV, normalizeMerchantName, isDuplicateTransaction } from '@/lib/transaction-parser';

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
});
