'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw, Wallet } from 'lucide-react';
import { BudgetData } from '@/types/budget';
import { loadBudgetData, saveBudgetData, resetBudgetData, exportBudgetData, importBudgetData } from '@/lib/storage';
import { calculateBudgetSummary } from '@/lib/calculations';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { AmountLeftCard } from '@/components/dashboard/amount-left-card';
import { AllocationChart } from '@/components/dashboard/allocation-chart';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { IncomeSection } from '@/components/sections/income-section';
import { ExpensesSection } from '@/components/sections/expenses-section';
import { BillsSection } from '@/components/sections/bills-section';
import { SavingsSection } from '@/components/sections/savings-section';
import { DebtSection } from '@/components/sections/debt-section';
import { DollarSign, CreditCard, PiggyBank, TrendingDown } from 'lucide-react';

export default function Home() {
  const [budgetData, setBudgetData] = useState<BudgetData>(loadBudgetData());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveBudgetData(budgetData);
    }
  }, [budgetData, mounted]);

  const summary = calculateBudgetSummary(budgetData);

  const handleExport = () => {
    const data = exportBudgetData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-tracker-${new Date().toISOString().split('T')[0]}.json`;
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

  if (!mounted) {
    return null;
  }

  const totalExpensesPlanned = budgetData.expenses.reduce((sum, item) => sum + item.planned, 0);
  const totalBillsPlanned = budgetData.bills.reduce((sum, item) => sum + item.planned, 0);
  const totalSavingsPlanned = budgetData.savings.reduce((sum, item) => sum + item.planned, 0);
  const totalDebtPlanned = budgetData.debt.reduce((sum, item) => sum + item.planned, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-10 w-10 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Budget Tracker
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleImport} variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-white/70 backdrop-blur">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
            <TabsTrigger value="debt">Debt</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
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
              income={budgetData.income}
              onUpdate={(income) => setBudgetData({ ...budgetData, income })}
            />
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <ExpensesSection
              expenses={budgetData.expenses}
              onUpdate={(expenses) => setBudgetData({ ...budgetData, expenses })}
            />
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <BillsSection
              bills={budgetData.bills}
              onUpdate={(bills) => setBudgetData({ ...budgetData, bills })}
            />
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings">
            <SavingsSection
              savings={budgetData.savings}
              onUpdate={(savings) => setBudgetData({ ...budgetData, savings })}
            />
          </TabsContent>

          {/* Debt Tab */}
          <TabsContent value="debt">
            <DebtSection
              debt={budgetData.debt}
              onUpdate={(debt) => setBudgetData({ ...budgetData, debt })}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
