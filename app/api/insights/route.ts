import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { MonthlyBudget } from '@/types/budget';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { budgetData, month, year } = await request.json() as {
      budgetData: MonthlyBudget;
      month: string;
      year: number;
    };

    // Calculate totals
    const totalIncome = budgetData.income.reduce((sum, item) => sum + item.actual, 0);
    const totalExpenses = budgetData.expenses.reduce((sum, item) => sum + item.actual, 0);
    const totalBills = budgetData.bills.reduce((sum, item) => sum + item.actual, 0);
    const totalSavings = budgetData.savings.reduce((sum, item) => sum + item.actual, 0);
    const totalDebt = budgetData.debt.reduce((sum, item) => sum + item.actual, 0);

    const totalPlannedExpenses = budgetData.expenses.reduce((sum, item) => sum + item.planned, 0);
    const totalPlannedBills = budgetData.bills.reduce((sum, item) => sum + item.planned, 0);

    const amountLeft = totalIncome - (totalExpenses + totalBills + totalSavings + totalDebt);

    // Create prompt for Claude
    const prompt = `You are BudgetBear, a friendly and encouraging financial assistant. Analyze this budget data and provide 3-4 actionable insights.

Budget for ${month} ${year}:
- Income: $${totalIncome}
- Expenses: $${totalExpenses} (Planned: $${totalPlannedExpenses})
- Bills: $${totalBills} (Planned: $${totalPlannedBills})
- Savings: $${totalSavings}
- Debt Payments: $${totalDebt}
- Amount Left: $${amountLeft}

Top Expenses:
${budgetData.expenses.slice(0, 5).map(e => `- ${e.name}: $${e.actual} (${e.progress}% of planned)`).join('\n')}

Provide insights in this JSON format:
[
  {
    "type": "success" | "warning" | "info" | "opportunity",
    "title": "Short title",
    "message": "Friendly, actionable message (1-2 sentences)",
    "icon": "💡" | "⚠️" | "🎯" | "✅"
  }
]

Focus on:
1. Spending patterns vs planned amounts
2. Upcoming risks or concerns
3. Positive achievements to celebrate
4. Actionable opportunities for improvement

Be encouraging and specific. Keep it concise and friendly.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20250219',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
    const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
