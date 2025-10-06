'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MonthlyBudget } from '@/types/budget';
import { Eye, Edit, Calendar } from 'lucide-react';

interface BudgetItem {
  name: string;
  planned?: number;
  actual?: number;
  amount?: number;
}

interface SharedBudget {
  id: string;
  name: string;
  description?: string;
  budgetData: MonthlyBudget;
  ownerId: string;
  permissions: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface SharedBudgetViewDialogProps {
  budget: SharedBudget;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SharedBudgetViewDialog({
  budget,
  currentUserId,
  open,
  onOpenChange,
}: SharedBudgetViewDialogProps) {
  const canEdit = budget.permissions[currentUserId] === 'edit';
  const isOwner = budget.ownerId === currentUserId;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const budgetData: MonthlyBudget = budget.budgetData;

  const calculateTotal = (items: Array<{ planned?: number; actual?: number; amount?: number }>) => {
    return items.reduce((sum, item) => {
      // Try planned first, then actual, then amount
      const value = item.planned ?? item.actual ?? item.amount ?? 0;
      const amount = typeof value === 'string' ? parseFloat(value) : value;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const totalIncome = calculateTotal(budgetData.income || []);
  const totalExpenses = calculateTotal(budgetData.expenses || []);
  const totalBills = calculateTotal(budgetData.bills || []);
  const totalSavings = calculateTotal(budgetData.savings || []);
  const totalDebt = calculateTotal(budgetData.debt || []);

  const totalSpending = totalExpenses + totalBills + totalSavings + totalDebt;
  const remaining = totalIncome - totalSpending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{budget.name}</DialogTitle>
              {budget.description && (
                <p className="text-sm text-gray-600 mt-1">{budget.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(budget.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  {canEdit ? (
                    <>
                      <Edit className="h-3 w-3" />
                      Can Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      View Only
                    </>
                  )}
                </span>
                {isOwner && <span className="text-blue-600">You are the owner</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Income</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Spending</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpending)}</p>
            </div>
            <div className={`p-4 rounded-lg border-2 ${remaining >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Remaining</h3>
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
          </div>

          {/* Budget Details */}
          <div className="space-y-4">
            {/* Income */}
            {budgetData.income && budgetData.income.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 text-green-600">Income</h3>
                <div className="space-y-2">
                  {budgetData.income.map((item: BudgetItem, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium text-green-600">{formatCurrency(item.planned ?? item.actual ?? item.amount ?? 0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Total Income</span>
                    <span className="text-green-600">{formatCurrency(totalIncome)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses */}
            {budgetData.expenses && budgetData.expenses.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 text-orange-600">Expenses</h3>
                <div className="space-y-2">
                  {budgetData.expenses.map((item: BudgetItem, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium text-orange-600">{formatCurrency(item.planned ?? item.actual ?? item.amount ?? 0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Total Expenses</span>
                    <span className="text-orange-600">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bills */}
            {budgetData.bills && budgetData.bills.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 text-red-600">Bills</h3>
                <div className="space-y-2">
                  {budgetData.bills.map((item: BudgetItem, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium text-red-600">{formatCurrency(item.planned ?? item.actual ?? item.amount ?? 0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Total Bills</span>
                    <span className="text-red-600">{formatCurrency(totalBills)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Savings */}
            {budgetData.savings && budgetData.savings.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 text-blue-600">Savings</h3>
                <div className="space-y-2">
                  {budgetData.savings.map((item: BudgetItem, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium text-blue-600">{formatCurrency(item.planned ?? item.actual ?? item.amount ?? 0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Total Savings</span>
                    <span className="text-blue-600">{formatCurrency(totalSavings)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Debt */}
            {budgetData.debt && budgetData.debt.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-3 text-purple-600">Debt Payments</h3>
                <div className="space-y-2">
                  {budgetData.debt.map((item: BudgetItem, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium text-purple-600">{formatCurrency(item.planned ?? item.actual ?? item.amount ?? 0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 font-bold">
                    <span>Total Debt Payments</span>
                    <span className="text-purple-600">{formatCurrency(totalDebt)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You have edit permissions for this budget. Editing functionality coming soon!
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
