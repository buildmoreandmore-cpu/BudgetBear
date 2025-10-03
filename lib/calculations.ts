import { MonthlyBudget, BudgetSummary } from '@/types/budget';

export const calculateBudgetSummary = (monthData: MonthlyBudget): BudgetSummary => {
  const totalIncome = monthData.income.reduce((sum, item) => sum + item.actual, 0);
  const totalExpenses = monthData.expenses.reduce((sum, item) => sum + item.actual, 0);
  const totalBills = monthData.bills.reduce((sum, item) => sum + item.actual, 0);
  const totalSavings = monthData.savings.reduce((sum, item) => sum + item.actual, 0);
  const totalDebt = monthData.debt.reduce((sum, item) => sum + item.actual, 0);

  const totalSpent = totalExpenses + totalBills + totalSavings + totalDebt;
  const amountLeftToSpend = totalIncome - totalSpent;

  return {
    totalIncome,
    totalExpenses,
    totalBills,
    totalSavings,
    totalDebt,
    amountLeftToSpend,
  };
};

export const calculateProgress = (actual: number, planned: number): number => {
  if (planned === 0) return 0;
  return Math.min(Math.round((actual / planned) * 100), 100);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};
