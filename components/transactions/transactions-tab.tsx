'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatementUploader } from './statement-uploader';
import { TransactionList } from './transaction-list';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Filter } from 'lucide-react';

interface TransactionsTabProps {
  month: string;
  year: number;
}

export function TransactionsTab({ month, year }: TransactionsTabProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUnreviewed, setShowUnreviewed] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month,
        year: year.toString(),
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(showUnreviewed && { unreviewed: 'true' }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('[Transactions Tab] Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [month, year, filterCategory, showUnreviewed]);

  const handleUpdateTransaction = async (transactionId: string, updates: any) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, updates }),
      });

      if (response.ok) {
        await fetchTransactions(); // Refresh
      }
    } catch (error) {
      console.error('[Transactions Tab] Error updating transaction:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          📊 Transaction Manager
        </h2>
        <p className="text-gray-600">
          Import bank statements and let AI categorize your transactions automatically
        </p>
      </div>

      {/* Upload Section */}
      <StatementUploader onUploadComplete={fetchTransactions} />

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Income</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${summary.totalIncome.toFixed(2)}
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Expenses</div>
                  <div className="text-2xl font-bold text-pink-600">
                    ${summary.totalExpenses.toFixed(2)}
                  </div>
                </div>
                <TrendingDown className="h-8 w-8 text-pink-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Bills</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${summary.totalBills.toFixed(2)}
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Needs Review</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {summary.unreviewedCount}
                  </div>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Spending Type Breakdown */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm font-semibold text-red-900 mb-1">Fixed Spending</div>
                <div className="text-2xl font-bold text-red-600">
                  ${summary.fixedSpending.toFixed(2)}
                </div>
                <div className="text-xs text-red-600 mt-1">Regular, predictable expenses</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-sm font-semibold text-yellow-900 mb-1">Flexible Spending</div>
                <div className="text-2xl font-bold text-yellow-600">
                  ${summary.flexibleSpending.toFixed(2)}
                </div>
                <div className="text-xs text-yellow-600 mt-1">Necessary but variable</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm font-semibold text-green-900 mb-1">Discretionary</div>
                <div className="text-2xl font-bold text-green-600">
                  ${summary.discretionarySpending.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 mt-1">Optional spending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="bill">Bills</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="debt">Debt Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={showUnreviewed ? 'default' : 'outline'}
              onClick={() => setShowUnreviewed(!showUnreviewed)}
            >
              {showUnreviewed ? 'Show All' : 'Unreviewed Only'}
              {summary && summary.unreviewedCount > 0 && (
                <Badge className="ml-2">{summary.unreviewedCount}</Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8 text-muted-foreground">
            No transactions found. Upload a bank statement to get started!
          </CardContent>
        </Card>
      ) : (
        <TransactionList transactions={transactions} onUpdate={handleUpdateTransaction} />
      )}
    </div>
  );
}
