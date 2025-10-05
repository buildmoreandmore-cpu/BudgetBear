import { parseCSV } from '@/lib/transaction-parser';

describe('Transaction Import Flow', () => {
  describe('CSV Parsing and Validation', () => {
    it('should successfully parse a valid bank CSV', () => {
      const validCSV = `Date,Description,Amount
01/15/2025,Grocery Store,50.00
01/16/2025,Gas Station,-45.50
01/17/2025,Paycheck,2000.00`;

      const result = parseCSV(validCSV);

      expect(result).toHaveLength(3);
      expect(result[0].description).toBe('Grocery Store');
      expect(result[1].description).toBe('Gas Station');
      expect(result[2].description).toBe('Paycheck');
    });

    it('should handle transactions with various date formats', () => {
      const csvWithDifferentDates = `Transaction Date,Description,Amount
2025-01-15,Online Purchase,75.00
01/16/2025,Store Purchase,25.50`;

      const result = parseCSV(csvWithDifferentDates);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(result[1].date).toBeInstanceOf(Date);
    });

    it('should parse debit/credit columns correctly', () => {
      const csvWithDebitCredit = `Date,Description,Debit,Credit
01/15/2025,Purchase,50.00,
01/16/2025,Refund,,25.00`;

      const result = parseCSV(csvWithDebitCredit);

      expect(result).toHaveLength(2);
      expect(result[0].transactionType).toBe('debit');
      expect(result[0].amount).toBe(50);
      expect(result[1].transactionType).toBe('credit');
      expect(result[1].amount).toBe(25);
    });

    it('should skip invalid rows without crashing', () => {
      const csvWithInvalidRows = `Date,Description,Amount
01/15/2025,Valid Transaction,50.00
,Missing Date,25.00
01/17/2025,,30.00
InvalidDate,Invalid,abc
01/18/2025,Another Valid,100.00`;

      const result = parseCSV(csvWithInvalidRows);

      // Should only parse the 2 valid rows
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Valid Transaction');
      expect(result[1].description).toBe('Another Valid');
    });

    it('should handle amount formatting variations', () => {
      const csvWithFormattedAmounts = `Date,Description,Amount
01/15/2025,Large Purchase,"1,234.56"
01/16/2025,Small Purchase,$45.00
01/17/2025,Negative Amount,-50.00`;

      const result = parseCSV(csvWithFormattedAmounts);

      expect(result).toHaveLength(3);
      expect(result[0].amount).toBe(1234.56);
      expect(result[1].amount).toBe(45);
      expect(result[2].amount).toBe(50); // Absolute value
    });
  });

  describe('Transaction Data Validation', () => {
    it('should ensure all required fields are present', () => {
      const csv = `Date,Description,Amount
01/15/2025,Test Transaction,100.00`;

      const result = parseCSV(csv);

      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('transactionType');
      expect(result[0]).toHaveProperty('merchantName');
    });

    it('should normalize merchant names', () => {
      const csv = `Date,Description,Amount
01/15/2025,AMAZON.COM*ABC123,50.00
01/16/2025,WAL-MART #1234,75.00`;

      const result = parseCSV(csv);

      expect(result[0].merchantName).toBe('Amazon');
      expect(result[1].merchantName).toBe('Walmart');
    });

    it('should handle description trimming', () => {
      const csv = `Date,Description,Amount
01/15/2025,"  Spaces Before and After  ",50.00`;

      const result = parseCSV(csv);

      expect(result[0].description).toBe('Spaces Before and After');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty CSV gracefully', () => {
      const emptyCSV = `Date,Description,Amount`;

      const result = parseCSV(emptyCSV);

      expect(result).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const headersOnly = `Date,Description,Amount\n`;

      const result = parseCSV(headersOnly);

      expect(result).toHaveLength(0);
    });

    it('should reject CSV without required columns', () => {
      const invalidCSV = `Name,Value\nJohn,100`;

      expect(() => parseCSV(invalidCSV)).not.toThrow();
      const result = parseCSV(invalidCSV);
      expect(result).toHaveLength(0); // No valid transactions
    });

    it('should handle transactions with zero amount correctly', () => {
      const csvWithZeroAmount = `Date,Description,Amount
01/15/2025,Zero Amount Transaction,0.00
01/16/2025,Valid Transaction,50.00`;

      const result = parseCSV(csvWithZeroAmount);

      // Zero amount transactions should be skipped
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Valid Transaction');
    });
  });
});
