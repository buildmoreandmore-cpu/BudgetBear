import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CategorizationRequest {
  description: string;
  amount: number;
  merchantName?: string;
  date?: string;
}

export interface CategorizationResult {
  category: 'income' | 'expense' | 'bill' | 'savings' | 'debt' | 'transfer';
  subcategory: string;
  spendingType: 'fixed' | 'flexible' | 'discretionary';
  confidence: number;
  isRecurring: boolean;
  recurringPattern?: 'weekly' | 'biweekly' | 'monthly' | 'annual';
  reasoning: string;
}

/**
 * Use Claude AI to categorize transactions
 * POST /api/transactions/categorize
 */
export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of transactions.' },
        { status: 400 }
      );
    }

    const prompt = `You are a financial AI assistant helping categorize bank transactions. Analyze each transaction and provide categorization details.

For each transaction, determine:
1. **category**: One of: income, expense, bill, savings, debt, transfer
2. **subcategory**: Specific type (e.g., "Groceries", "Restaurants", "Utilities", "Salary", "Freelance", etc.)
3. **spendingType**:
   - "fixed": Regular, predictable expenses (rent, subscriptions, insurance)
   - "flexible": Necessary but variable (groceries, utilities, gas)
   - "discretionary": Optional spending (entertainment, dining out, hobbies)
4. **confidence**: Your confidence level 0-100
5. **isRecurring**: Is this likely a recurring transaction?
6. **recurringPattern**: If recurring, what's the pattern? (weekly, biweekly, monthly, annual)
7. **reasoning**: Brief explanation of your categorization

Guidelines:
- "Bills" are recurring fixed payments (utilities, rent, subscriptions, insurance, loans)
- "Expenses" are variable purchases (groceries, shopping, dining)
- "Income" includes salary, wages, refunds, cashback
- "Savings" are transfers to savings accounts or investments
- "Debt" payments are loan/credit card payments
- "Transfer" is money moved between own accounts

Respond with a JSON array matching the input transaction order.

Transactions to categorize:
${JSON.stringify(transactions, null, 2)}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    let categorizations: CategorizationResult[];
    try {
      // Try to parse the entire response as JSON
      categorizations = JSON.parse(content.text);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
      if (jsonMatch) {
        categorizations = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not extract JSON from Claude response');
      }
    }

    return NextResponse.json({
      success: true,
      categorizations,
    });
  } catch (error: any) {
    console.error('[Categorization API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to categorize transactions' },
      { status: 500 }
    );
  }
}
