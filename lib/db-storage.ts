import { BudgetData, MonthlyBudget } from '@/types/budget';
import { loadBudgetData as loadLocalBudgetData } from './storage';

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

  years[currentYear] = {};
  MONTHS.forEach(month => {
    years[currentYear][month] = getEmptyMonth();
  });

  return { years };
};

// Load budget from database
export async function loadBudgetFromDB(year: number, month: string): Promise<MonthlyBudget | null> {
  try {
    const response = await fetch(`/api/budgets?year=${year}&month=${month}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.budget?.budgetData || null;
  } catch (error) {
    console.error('Error loading budget from DB:', error);
    return null;
  }
}

// Save budget to database
export async function saveBudgetToDB(year: number, month: string, budgetData: MonthlyBudget): Promise<boolean> {
  try {
    const response = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, budgetData }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving budget to DB:', error);
    return false;
  }
}

// Migrate localStorage data to database (one-time migration, then clear localStorage)
export async function migrateLocalStorageToDB(): Promise<void> {
  try {
    // Check if migration has already been done for this user
    const migrationKey = 'budget-bear-migrated';
    if (typeof window !== 'undefined' && localStorage.getItem(migrationKey)) {
      return; // Already migrated
    }

    const localData = loadLocalBudgetData();
    let hasMigratedData = false;

    for (const yearKey of Object.keys(localData.years)) {
      const year = parseInt(yearKey);
      const yearData = localData.years[year];

      for (const month of MONTHS) {
        const monthData = yearData[month];
        if (monthData && (
          monthData.income?.length > 0 ||
          monthData.expenses?.length > 0 ||
          monthData.bills?.length > 0 ||
          monthData.savings?.length > 0 ||
          monthData.debt?.length > 0
        )) {
          await saveBudgetToDB(year, month, monthData);
          hasMigratedData = true;
        }
      }
    }

    // Mark migration as complete and clear localStorage budget data
    if (typeof window !== 'undefined') {
      localStorage.setItem(migrationKey, 'true');
      if (hasMigratedData) {
        localStorage.removeItem('budget-bear-data'); // Clear old data
      }
    }
  } catch (error) {
    console.error('Error migrating localStorage to DB:', error);
  }
}
