'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw, FileSpreadsheet, FileText, LogOut } from 'lucide-react';
import { BudgetData, MonthlyBudget } from '@/types/budget';
import { loadBudgetData, saveBudgetData, resetBudgetData, exportBudgetData, importBudgetData } from '@/lib/storage';
import { calculateBudgetSummary } from '@/lib/calculations';
import { exportToExcel, exportToPDF, exportToDoc } from '@/lib/export';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { AmountLeftCard } from '@/components/dashboard/amount-left-card';
import { AllocationChart } from '@/components/dashboard/allocation-chart';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { IncomeSection } from '@/components/sections/income-section';
import { ExpensesSection } from '@/components/sections/expenses-section';
import { BillsSection } from '@/components/sections/bills-section';
import { SavingsSection } from '@/components/sections/savings-section';
import { DebtSection } from '@/components/sections/debt-section';
import { MonthSelector } from '@/components/month-selector';
import { InsightsPanel } from '@/components/ai/insights-panel';
import { DollarSign, CreditCard, PiggyBank } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [budgetData, setBudgetData] = useState<BudgetData>(loadBudgetData());
  const [mounted, setMounted] = useState(false);

  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (mounted) {
      saveBudgetData(budgetData);
    }
  }, [budgetData, mounted]);

  // Ensure the selected year exists
  if (!budgetData.years[selectedYear]) {
    budgetData.years[selectedYear] = {
      january: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      february: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      march: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      april: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      may: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      june: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      july: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      august: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      september: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      october: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      november: { income: [], expenses: [], bills: [], savings: [], debt: [] },
      december: { income: [], expenses: [], bills: [], savings: [], debt: [] },
    };
  }

  const currentMonthData: MonthlyBudget = budgetData.years[selectedYear]?.[selectedMonth] || {
    income: [],
    expenses: [],
    bills: [],
    savings: [],
    debt: [],
  };

  const summary = calculateBudgetSummary(currentMonthData);

  const updateMonthData = (monthData: MonthlyBudget) => {
    setBudgetData({
      ...budgetData,
      years: {
        ...budgetData.years,
        [selectedYear]: {
          ...budgetData.years[selectedYear],
          [selectedMonth]: monthData,
        },
      },
    });
  };

  const handleExport = () => {
    const data = exportBudgetData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgetbear-${selectedYear}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (importBudgetData(content)) {
            setBudgetData(loadBudgetData());
            alert('Budget data imported successfully!');
          } else {
            alert('Failed to import budget data. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all budget data? This cannot be undone.')) {
      resetBudgetData();
      setBudgetData(loadBudgetData());
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!mounted || authLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  const totalExpensesPlanned = currentMonthData.expenses.reduce((sum, item) => sum + item.planned, 0);
  const totalBillsPlanned = currentMonthData.bills.reduce((sum, item) => sum + item.planned, 0);
  const totalSavingsPlanned = currentMonthData.savings.reduce((sum, item) => sum + item.planned, 0);
  const totalDebtPlanned = currentMonthData.debt.reduce((sum, item) => sum + item.planned, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-5xl">🧸</span>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              BudgetBear
            </h1>
          </div>

          {/* Month/Year Selectors */}
          <div className="flex justify-center gap-2 mb-4">
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>

          {/* Export Buttons Row */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Button onClick={() => exportToExcel(currentMonthData, selectedMonth, selectedYear)} variant="outline" size="sm" className="bg-white">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Excel
            </Button>
            <Button onClick={() => exportToPDF(currentMonthData, selectedMonth, selectedYear)} variant="outline" size="sm" className="bg-white">
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button onClick={() => exportToDoc(currentMonthData, selectedMonth, selectedYear)} variant="outline" size="sm" className="bg-white">
              <FileText className="h-4 w-4 mr-1" />
              Doc
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm" className="bg-white">
              <Download className="h-4 w-4 mr-1" />
              JSON
            </Button>
          </div>

          {/* Import/Reset/Sign Out Row */}
          <div className="flex justify-center gap-2">
            <Button onClick={handleImport} variant="outline" size="sm" className="bg-white">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="bg-white">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="bg-white">
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0 h-auto">
            <TabsTrigger value="dashboard" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Dashboard</TabsTrigger>
            <TabsTrigger value="income" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Income</TabsTrigger>
            <TabsTrigger value="expenses" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Expenses</TabsTrigger>
            <TabsTrigger value="bills" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Bills</TabsTrigger>
            <TabsTrigger value="savings" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Savings</TabsTrigger>
            <TabsTrigger value="debt" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Debt</TabsTrigger>
            <TabsTrigger value="insights" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Insights</TabsTrigger>
            <TabsTrigger value="community" className="bg-white rounded-xl py-3 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900">Community</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* AI Insights Panel */}
            <InsightsPanel
              budgetData={currentMonthData}
              month={selectedMonth}
              year={selectedYear}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Income"
                amount={summary.totalIncome}
                icon={DollarSign}
                color="text-green-600"
              />
              <SummaryCard
                title="Expenses"
                amount={summary.totalExpenses}
                icon={CreditCard}
                color="text-pink-600"
              />
              <SummaryCard
                title="Bills"
                amount={summary.totalBills}
                icon={CreditCard}
                color="text-blue-600"
              />
              <SummaryCard
                title="Savings"
                amount={summary.totalSavings}
                icon={PiggyBank}
                color="text-purple-600"
              />
            </div>

            {/* Amount Left Card */}
            <AmountLeftCard
              amountLeft={summary.amountLeftToSpend}
              totalIncome={summary.totalIncome}
            />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AllocationChart
                expenses={summary.totalExpenses}
                bills={summary.totalBills}
                savings={summary.totalSavings}
                debt={summary.totalDebt}
              />
              <CashFlowChart
                expensesPlanned={totalExpensesPlanned}
                expensesActual={summary.totalExpenses}
                billsPlanned={totalBillsPlanned}
                billsActual={summary.totalBills}
                savingsPlanned={totalSavingsPlanned}
                savingsActual={summary.totalSavings}
                debtPlanned={totalDebtPlanned}
                debtActual={summary.totalDebt}
              />
            </div>
          </TabsContent>

          {/* Income Tab */}
          <TabsContent value="income">
            <IncomeSection
              income={currentMonthData.income}
              onUpdate={(income) => updateMonthData({ ...currentMonthData, income })}
            />
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <ExpensesSection
              expenses={currentMonthData.expenses}
              onUpdate={(expenses) => updateMonthData({ ...currentMonthData, expenses })}
            />
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <BillsSection
              bills={currentMonthData.bills}
              onUpdate={(bills) => updateMonthData({ ...currentMonthData, bills })}
            />
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings">
            <SavingsSection
              savings={currentMonthData.savings}
              onUpdate={(savings) => updateMonthData({ ...currentMonthData, savings })}
            />
          </TabsContent>

          {/* Debt Tab */}
          <TabsContent value="debt">
            <DebtSection
              debt={currentMonthData.debt}
              onUpdate={(debt) => updateMonthData({ ...currentMonthData, debt })}
            />
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <InsightsPanel
              budgetData={currentMonthData}
              month={selectedMonth}
              year={selectedYear}
            />

            {/* Future: Add spending trends, predictions, and detailed analytics here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart
                expensesPlanned={totalExpensesPlanned}
                expensesActual={summary.totalExpenses}
                billsPlanned={totalBillsPlanned}
                billsActual={summary.totalBills}
                savingsPlanned={totalSavingsPlanned}
                savingsActual={summary.totalSavings}
                debtPlanned={totalDebtPlanned}
                debtActual={summary.totalDebt}
              />
              <AllocationChart
                expenses={summary.totalExpenses}
                bills={summary.totalBills}
                savings={summary.totalSavings}
                debt={summary.totalDebt}
              />
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="text-center py-16">
              <h2 className="text-3xl font-bold mb-4">Community Features Coming Soon! 🧸</h2>
              <p className="text-muted-foreground mb-8">
                Share budgets with family, connect with accountability partners, and join the BudgetBear community.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="font-semibold mb-2">Family Budgets</h3>
                  <p className="text-sm text-muted-foreground">
                    Share and collaborate on budgets with family members
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-4xl mb-3">🤝</div>
                  <h3 className="font-semibold mb-2">Accountability Partners</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with friends for financial motivation and support
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="font-semibold mb-2">Community Challenges</h3>
                  <p className="text-sm text-muted-foreground">
                    Join savings challenges and compete with other users
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
