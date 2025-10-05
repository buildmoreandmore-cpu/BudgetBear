'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Edit2, Save, X } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transactionType: string;
  category: string;
  subcategory: string | null;
  spendingType: string | null;
  aiCategory: string | null;
  aiConfidence: number | null;
  isReviewed: boolean;
  wasRecategorized: boolean;
  merchantName: string | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: (transactionId: string, updates: any) => Promise<void>;
}

export function TransactionList({ transactions, onUpdate }: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditValues({
      category: transaction.category,
      subcategory: transaction.subcategory || '',
      spendingType: transaction.spendingType || 'flexible',
    });
  };

  const handleSave = async (transactionId: string) => {
    await onUpdate(transactionId, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({});
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      income: 'bg-green-100 text-green-800',
      expense: 'bg-pink-100 text-pink-800',
      bill: 'bg-blue-100 text-blue-800',
      savings: 'bg-purple-100 text-purple-800',
      debt: 'bg-slate-100 text-slate-800',
      transfer: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSpendingTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fixed: 'bg-red-100 text-red-800',
      flexible: 'bg-yellow-100 text-yellow-800',
      discretionary: 'bg-green-100 text-green-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const isEditing = editingId === transaction.id;

        return (
          <Card key={transaction.id} className={`
            ${!transaction.isReviewed ? 'border-2 border-yellow-300 bg-yellow-50/30' : ''}
            ${transaction.wasRecategorized ? 'border-l-4 border-l-blue-500' : ''}
          `}>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Date & Status */}
                <div className="md:col-span-2">
                  <div className="text-sm font-medium">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {transaction.isReviewed ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {transaction.isReviewed ? 'Reviewed' : 'Needs Review'}
                    </span>
                  </div>
                </div>

                {/* Description & Merchant */}
                <div className="md:col-span-3">
                  <div className="font-medium text-sm">{transaction.merchantName || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {transaction.description}
                  </div>
                  {transaction.wasRecategorized && (
                    <Badge variant="outline" className="mt-1 text-xs">User Modified</Badge>
                  )}
                </div>

                {/* Amount */}
                <div className="md:col-span-1 text-right">
                  <div className={`font-bold ${transaction.transactionType === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.transactionType === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                </div>

                {/* Category */}
                <div className="md:col-span-2">
                  {isEditing ? (
                    <Select
                      value={editValues.category}
                      onValueChange={(v) => setEditValues({ ...editValues, category: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="bill">Bill</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="debt">Debt Payment</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>
                      <Badge className={getCategoryColor(transaction.category)}>
                        {transaction.category}
                      </Badge>
                      {transaction.aiCategory && transaction.aiCategory !== transaction.category && (
                        <div className="text-xs text-muted-foreground mt-1">
                          AI: {transaction.aiCategory} ({transaction.aiConfidence}%)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Spending Type */}
                <div className="md:col-span-2">
                  {isEditing ? (
                    <Select
                      value={editValues.spendingType}
                      onValueChange={(v) => setEditValues({ ...editValues, spendingType: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                        <SelectItem value="discretionary">Discretionary</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    transaction.spendingType && (
                      <Badge className={getSpendingTypeColor(transaction.spendingType)}>
                        {transaction.spendingType}
                      </Badge>
                    )
                  )}
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex gap-2 justify-end">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSave(transaction.id)}
                        className="h-8 px-2"
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-8 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(transaction)}
                      className="h-8 px-2"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
