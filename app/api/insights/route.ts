import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { MonthlyBudget } from '@/types/budget';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface HistoricalData {
  month: string;
  income: number;
  expenses: number;
  bills: number;
  savings: number;
  debt: number;
}

export async function POST(request: NextRequest) {
  try {
    const { budgetData, month, year, allBudgetData } = await request.json() as {
      budgetData: MonthlyBudget;
      month: string;
      year: number;
      allBudgetData?: Record<number, Record<string, MonthlyBudget>>;
    };

    // Calculate totals for current month
    const totalIncome = budgetData.income.reduce((sum, item) => sum + item.actual, 0);
    const totalExpenses = budgetData.expenses.reduce((sum, item) => sum + item.actual, 0);
    const totalBills = budgetData.bills.reduce((sum, item) => sum + item.actual, 0);
    const totalSavings = budgetData.savings.reduce((sum, item) => sum + item.actual, 0);
    const totalDebt = budgetData.debt.reduce((sum, item) => sum + item.actual, 0);

    const totalPlannedExpenses = budgetData.expenses.reduce((sum, item) => sum + item.planned, 0);
    const totalPlannedBills = budgetData.bills.reduce((sum, item) => sum + item.planned, 0);

    const amountLeft = totalIncome - (totalExpenses + totalBills + totalSavings + totalDebt);

    // Calculate historical trends if data available
    let historicalAnalysis = '';
    if (allBudgetData) {
      const historical: HistoricalData[] = [];
      const monthOrder = ['january', 'february', 'march', 'april', 'may', 'june',
                         'july', 'august', 'september', 'october', 'november', 'december'];

      // Gather last 3 months of data
      Object.keys(allBudgetData).forEach(yr => {
        monthOrder.forEach(mn => {
          const data = allBudgetData[Number(yr)]?.[mn];
          if (data) {
            const income = data.income.reduce((sum, item) => sum + item.actual, 0);
            const expenses = data.expenses.reduce((sum, item) => sum + item.actual, 0);
            const bills = data.bills.reduce((sum, item) => sum + item.actual, 0);
            const savings = data.savings.reduce((sum, item) => sum + item.actual, 0);
            const debt = data.debt.reduce((sum, item) => sum + item.actual, 0);

            if (income > 0 || expenses > 0 || bills > 0) {
              historical.push({ month: `${mn} ${yr}`, income, expenses, bills, savings, debt });
            }
          }
        });
      });

      if (historical.length > 1) {
        const recent = historical.slice(-3);
        historicalAnalysis = `\n\nHistorical Trend (Last 3 Months):\n${recent.map(h =>
          `- ${h.month}: Income: $${h.income}, Expenses: $${h.expenses}, Savings: $${h.savings}`
        ).join('\n')}`;

        // Calculate averages
        const avgIncome = recent.reduce((sum, h) => sum + h.income, 0) / recent.length;
        const avgExpenses = recent.reduce((sum, h) => sum + h.expenses, 0) / recent.length;
        const avgSavings = recent.reduce((sum, h) => sum + h.savings, 0) / recent.length;

        historicalAnalysis += `\n\n3-Month Averages: Income: $${avgIncome.toFixed(2)}, Expenses: $${avgExpenses.toFixed(2)}, Savings: $${avgSavings.toFixed(2)}`;
      }
    }

    // Create prompt for Claude
    const prompt = `You are BudgetBear, a friendly and encouraging financial assistant. Analyze this budget data and provide 4-5 actionable insights with historical context.

Budget for ${month} ${year}:
- Income: $${totalIncome}
- Expenses: $${totalExpenses} (Planned: $${totalPlannedExpenses})
- Bills: $${totalBills} (Planned: $${totalPlannedBills})
- Savings: $${totalSavings}
- Debt Payments: $${totalDebt}
- Amount Left: $${amountLeft}

Top Expenses:
${budgetData.expenses.slice(0, 5).map(e => `- ${e.name}: $${e.actual} (${e.progress}% of planned)`).join('\n')}
${historicalAnalysis}

Provide insights in this JSON format:
[
  {
    "type": "success" | "warning" | "info" | "opportunity",
    "title": "Short title",
    "message": "Friendly, actionable message (1-2 sentences)",
    "icon": "💡" | "⚠️" | "🎯" | "✅" | "📈" | "💰"
  }
]

Focus on:
1. Spending patterns vs planned amounts
2. Trends compared to historical averages (if available)
3. Predictions for next month based on patterns
4. Upcoming risks or concerns
5. Positive achievements to celebrate
6. Actionable opportunities for improvement

Be encouraging and specific. Use historical data to provide context and predictions. Keep it concise and friendly.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
