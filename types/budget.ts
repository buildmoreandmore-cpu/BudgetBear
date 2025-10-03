export interface IncomeItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
  progress: number;
  completed: boolean;
}

export interface BillItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
  progress: number;
  completed: boolean;
  dueDate?: string;
}

export interface SavingsItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
  progress: number;
}

export interface DebtItem {
  id: string;
  name: string;
  planned: number;
  actual: number;
  progress: number;
  completed: boolean;
}

export interface MonthlyBudget {
  income: IncomeItem[];
  expenses: ExpenseItem[];
  bills: BillItem[];
  savings: SavingsItem[];
  debt: DebtItem[];
}

export interface BudgetData {
  years: {
    [year: number]: {
      [month: string]: MonthlyBudget; // Keys: 'january', 'february', etc.
    };
  };
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  totalBills: number;
  totalSavings: number;
  totalDebt: number;
  amountLeftToSpend: number;
}
