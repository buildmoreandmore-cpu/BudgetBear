import { BudgetData } from '@/types/budget';

const STORAGE_KEY = 'budget-tracker-data';

export const getDefaultBudgetData = (): BudgetData => ({
  income: [],
  expenses: [],
  bills: [],
  savings: [],
  debt: [],
});

export const loadBudgetData = (): BudgetData => {
  if (typeof window === 'undefined') return getDefaultBudgetData();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return getDefaultBudgetData();

  try {
    return JSON.parse(stored);
  } catch {
    return getDefaultBudgetData();
  }
};

export const saveBudgetData = (data: BudgetData): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const resetBudgetData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};

export const exportBudgetData = (): string => {
  const data = loadBudgetData();
  return JSON.stringify(data, null, 2);
};

export const importBudgetData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    saveBudgetData(data);
    return true;
  } catch {
    return false;
  }
};
