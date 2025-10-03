import { BudgetData, MonthlyBudget } from '@/types/budget';

const STORAGE_KEY = 'budget-bear-data';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const getEmptyMonth = (): MonthlyBudget => ({
  income: [],
  expenses: [],
  bills: [],
  savings: [],
  debt: [],
});

export const getDefaultBudgetData = (): BudgetData => {
  const currentYear = new Date().getFullYear();
  const years: { [year: number]: { [key: string]: MonthlyBudget } } = {};

  // Initialize current year with all 12 months
  years[currentYear] = {};
  MONTHS.forEach(month => {
    years[currentYear][month] = getEmptyMonth();
  });

  return {
    years,
  };
};

export const loadBudgetData = (): BudgetData => {
  if (typeof window === 'undefined') return getDefaultBudgetData();

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return getDefaultBudgetData();

  try {
    const data = JSON.parse(stored);

    // Migrate old format to new format if needed
    if (data.year && data.months) {
      const migratedData: BudgetData = {
        years: {
          [data.year]: data.months,
        },
      };
      saveBudgetData(migratedData);
      return migratedData;
    }

    // Ensure all years have all 12 months
    const years = data.years || {};
    Object.keys(years).forEach(yearKey => {
      const year = parseInt(yearKey);
      MONTHS.forEach(month => {
        if (!years[year][month]) {
          years[year][month] = getEmptyMonth();
        }
      });
    });

    return { years };
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
