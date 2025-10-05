'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Upload, RefreshCw, FileSpreadsheet, FileText, LogOut } from 'lucide-react';
import { BudgetData, MonthlyBudget } from '@/types/budget';
import { loadBudgetData, saveBudgetData, resetBudgetData, exportBudgetData, importBudgetData } from '@/lib/storage';
import { loadBudgetFromDB, saveBudgetToDB, migrateLocalStorageToDB, getDefaultBudgetData } from '@/lib/db-storage';
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
import { DollarSign, CreditCard, PiggyBank } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { InsightsPanel } from '@/components/ai/insights-panel';
import { ShareBudgetDialog } from '@/components/community/share-budget-dialog';
import { PartnerCard } from '@/components/community/partner-card';
import { InviteLinkGenerator } from '@/components/community/invite-link-generator';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [budgetData, setBudgetData] = useState<BudgetData>(getDefaultBudgetData());
  const [mounted, setMounted] = useState(false);
  const [migrated, setMigrated] = useState(false);

  const currentDate = new Date();
  const currentMonthName = currentDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [partnerships, setPartnerships] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Check for pending invitation after login
  useEffect(() => {
    if (mounted && user) {
      const pendingInvitation = localStorage.getItem('pending_invitation');
      if (pendingInvitation) {
        // Auto-accept the invitation
        fetch('/api/invitations/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: pendingInvitation }),
        }).then(() => {
          localStorage.removeItem('pending_invitation');
        }).catch((err) => {
          console.error('[BudgetBear] Failed to auto-accept invitation:', err);
        });
      }
    }
  }, [mounted, user]);

  // Migrate localStorage data to database once on mount
  useEffect(() => {
    if (mounted && user && !migrated) {
      console.log('[BudgetBear] Starting migration for user:', user.id);
      migrateLocalStorageToDB().then(() => {
        console.log('[BudgetBear] Migration complete');
        setMigrated(true);
      });
    }
  }, [mounted, user, migrated]);

  // Load budget from database when month/year changes
  useEffect(() => {
    if (mounted && user && migrated) {
      console.log('[BudgetBear] Loading budget from DB for user:', user.id, 'year:', selectedYear, 'month:', selectedMonth);
      loadBudgetFromDB(selectedYear, selectedMonth).then(data => {
        console.log('[BudgetBear] Loaded budget data:', data);
        if (data) {
          setBudgetData(prev => ({
            ...prev,
            years: {
              ...prev.years,
              [selectedYear]: {
                ...prev.years[selectedYear],
                [selectedMonth]: data,
              },
            },
          }));
        }
      });
    }
  }, [selectedMonth, selectedYear, mounted, user, migrated]);

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
    console.log('[BudgetBear] Saving budget to DB for user:', user?.id, 'year:', selectedYear, 'month:', selectedMonth);
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
    // Save to database
    if (user) {
      saveBudgetToDB(selectedYear, selectedMonth, monthData).then(success => {
        console.log('[BudgetBear] Save result:', success);
      });
    }
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

  const fetchPartnerData = async () => {
    try {
      const response = await fetch('/api/partners');
      if (response.ok) {
        const data = await response.json();
        setPartnerships(data.partnerships || []);
        setReceivedRequests(data.receivedRequests || []);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  useEffect(() => {
    if (mounted && user) {
      fetchPartnerData();
    }
  }, [mounted, user]);

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
        {/* Header - Simple mobile design */}
        <div className="mb-4 md:mb-6">
          {/* Logo and Month/Year in one clean row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Logo - smaller on mobile */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-2xl md:text-4xl">🧸</span>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                BudgetBear
              </h1>
            </div>

            {/* Sign Out button - only on mobile */}
            <Button onClick={handleSignOut} variant="outline" size="sm" className="md:hidden bg-red-50 border-red-300">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Month/Year Selectors - Full width on mobile */}
          <div className="flex gap-2 mb-3">
            <MonthSelector
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          </div>

          {/* Action Buttons - Hidden on mobile, shown on desktop */}
          <div className="hidden md:flex gap-2">
            <ShareBudgetDialog budgetData={currentMonthData} month={selectedMonth} year={selectedYear} />
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
            <Button onClick={handleImport} variant="outline" size="sm" className="bg-white">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm" className="bg-white">
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm" className="bg-red-50 border-red-300 hover:bg-red-100">
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
          {/* Simplified tab bar with text labels */}
          <div className="border-b border-gray-200 mb-4">
            <TabsList className="w-full flex justify-around bg-transparent p-0 h-auto">
              <TabsTrigger value="dashboard" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Income
              </TabsTrigger>
              <TabsTrigger value="expenses" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="bills" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Bills
              </TabsTrigger>
              <TabsTrigger value="savings" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Savings
              </TabsTrigger>
              <TabsTrigger value="debt" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Debt
              </TabsTrigger>
              <TabsTrigger value="community" className="flex-1 py-3 px-1 text-xs md:text-base border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-900 rounded-none">
                Community
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 mt-0">
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

            {/* AI Insights Panel */}
            <InsightsPanel
              budgetData={currentMonthData}
              month={selectedMonth}
              year={selectedYear}
              allBudgetData={budgetData.years}
            />

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
          <TabsContent value="income" className="mt-0">
            <IncomeSection
              income={currentMonthData.income}
              onUpdate={(income) => updateMonthData({ ...currentMonthData, income })}
            />
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="mt-0">
            <ExpensesSection
              expenses={currentMonthData.expenses}
              onUpdate={(expenses) => updateMonthData({ ...currentMonthData, expenses })}
            />
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" className="mt-0">
            <BillsSection
              bills={currentMonthData.bills}
              onUpdate={(bills) => updateMonthData({ ...currentMonthData, bills })}
            />
          </TabsContent>

          {/* Savings Tab */}
          <TabsContent value="savings" className="mt-0">
            <SavingsSection
              savings={currentMonthData.savings}
              onUpdate={(savings) => updateMonthData({ ...currentMonthData, savings })}
            />
          </TabsContent>

          {/* Debt Tab */}
          <TabsContent value="debt" className="mt-0">
            <DebtSection
              debt={currentMonthData.debt}
              onUpdate={(debt) => updateMonthData({ ...currentMonthData, debt })}
            />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="mt-0">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border-2 border-purple-200 shadow-lg">
                <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  🧸 BudgetBear Community
                </h2>
                <p className="text-gray-600 mb-4">
                  Connect with family and accountability partners to achieve your financial goals together!
                </p>
              </div>

              <PartnerCard
                partnerships={partnerships}
                receivedRequests={receivedRequests}
                onRefresh={fetchPartnerData}
              />

              <InviteLinkGenerator />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-green-200 shadow-lg">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>📊</span> Shared Budgets
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Collaborate on budgets with family members. Share your financial plans and work together toward common goals.
                  </p>
                  <ShareBudgetDialog budgetData={currentMonthData} month={selectedMonth} year={selectedYear} />
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-yellow-200 shadow-lg">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <span>💡</span> Community Tips
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Learn from others! Share your budgeting wisdom and discover tips from the BudgetBear community.
                  </p>
                  <p className="text-xs text-gray-500 italic">Coming soon...</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-200">
                <h3 className="text-lg font-bold mb-3">🎯 How Accountability Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl mb-2">1️⃣</div>
                    <h4 className="font-semibold mb-1">Find a Partner</h4>
                    <p className="text-gray-600 text-xs">Send a request to someone you trust to be your accountability partner.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl mb-2">2️⃣</div>
                    <h4 className="font-semibold mb-1">Set Goals Together</h4>
                    <p className="text-gray-600 text-xs">Define your financial goals and check in regularly with your partner.</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="text-2xl mb-2">3️⃣</div>
                    <h4 className="font-semibold mb-1">Achieve Success</h4>
                    <p className="text-gray-600 text-xs">Stay motivated and accountable as you work toward your goals together!</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </main>
  );
}
