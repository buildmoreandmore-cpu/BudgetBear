import { BudgetData } from '@/types/budget';

const STORAGE_KEY = 'budget-tracker-data';

export const getDefaultBudgetData = (): BudgetData => ({
  income: [
    { id: '1', name: 'Paycheck', planned: 18600, actual: 18600 },
  ],
  expenses: [
    { id: '1', name: 'Takeout & late night dinners', planned: 1400, actual: 1400, progress: 100, completed: true },
    { id: '2', name: 'Blazers, heels & handbags', planned: 1200, actual: 1200, progress: 100, completed: true },
    { id: '3', name: 'Ubders', planned: 500, actual: 500, progress: 100, completed: true },
    { id: '4', name: 'Pilates & yoga', planned: 320, actual: 320, progress: 100, completed: true },
    { id: '5', name: 'Hair, lashes & spa', planned: 1700, actual: 1700, progress: 100, completed: true },
    { id: '6', name: 'Champagne brunches', planned: 1100, actual: 1100, progress: 100, completed: true },
  ],
  bills: [
    { id: '1', name: 'Manhattan apartment', planned: 3600, actual: 3600, progress: 100, completed: true },
    { id: '2', name: 'Utilities', planned: 480, actual: 480, progress: 100, completed: true },
    { id: '3', name: 'Parking spot', planned: 260, actual: 0, progress: 0, completed: false },
    { id: '4', name: 'Case law software', planned: 220, actual: 0, progress: 0, completed: false },
    { id: '5', name: 'Dog walker', planned: 400, actual: 0, progress: 0, completed: false },
  ],
  savings: [
    { id: '1', name: 'Investments', planned: 2600, actual: 0, progress: 0 },
    { id: '2', name: 'Future home fund', planned: 2000, actual: 0, progress: 0 },
    { id: '3', name: 'Vacations', planned: 800, actual: 0, progress: 0 },
    { id: '4', name: 'Family support', planned: 500, actual: 0, progress: 0 },
  ],
  debt: [
    { id: '1', name: 'Law school loans', planned: 1800, actual: 1800, progress: 100, completed: true },
    { id: '2', name: 'Credit cards', planned: 700, actual: 0, progress: 0, completed: false },
    { id: '3', name: 'Luxury handbags', planned: 450, actual: 0, progress: 0, completed: false },
  ],
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
