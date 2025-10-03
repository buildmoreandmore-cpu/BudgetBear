'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { IncomeItem } from '@/types/budget';
import { formatCurrency } from '@/lib/calculations';
import { useState } from 'react';

interface IncomeSectionProps {
  income: IncomeItem[];
  onUpdate: (income: IncomeItem[]) => void;
}

export function IncomeSection({ income, onUpdate }: IncomeSectionProps) {
  const [newItemName, setNewItemName] = useState('');

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: IncomeItem = {
      id: Date.now().toString(),
      name: newItemName,
      planned: 0,
      actual: 0,
    };
    onUpdate([...income, newItem]);
    setNewItemName('');
  };

  const updateItem = (id: string, field: 'name' | 'planned' | 'actual', value: string | number) => {
    onUpdate(
      income.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    onUpdate(income.filter((item) => item.id !== id));
  };

  const totalPlanned = income.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = income.reduce((sum, item) => sum + item.actual, 0);

  return (
    <Card className="bg-purple-50/50">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-wide text-purple-900">Income</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground uppercase">
            <div className="col-span-5">Source</div>
            <div className="col-span-3 text-right">Planned</div>
            <div className="col-span-3 text-right">Actual</div>
            <div className="col-span-1"></div>
          </div>

          {income.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
              <Input
                className="col-span-5 bg-white border-2 rounded-md shadow-sm"
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = e.currentTarget.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
                    nextInput?.focus();
                  }
                }}
                placeholder="Income source"
              />
              <Input
                className="col-span-3 bg-white text-right border-2 rounded-md shadow-sm"
                type="number"
                step="0.01"
                value={item.planned === 0 ? '' : item.planned}
                onChange={(e) => updateItem(item.id, 'planned', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const inputs = Array.from(e.currentTarget.parentElement?.querySelectorAll('input') || []);
                    const currentIndex = inputs.indexOf(e.currentTarget as HTMLInputElement);
                    const nextInput = inputs[currentIndex + 1] as HTMLInputElement;
                    nextInput?.focus();
                  }
                }}
                placeholder="0.00"
              />
              <Input
                className="col-span-3 bg-white text-right border-2 rounded-md shadow-sm"
                type="number"
                step="0.01"
                value={item.actual === 0 ? '' : item.actual}
                onChange={(e) => updateItem(item.id, 'actual', parseFloat(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                placeholder="0.00"
              />
              <Button
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => deleteItem(item.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          <div className="grid grid-cols-12 gap-4">
            <Input
              placeholder="Add new income source"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="col-span-11 bg-white"
            />
            <Button onClick={addItem} size="icon" className="col-span-1">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-4 pt-4 border-t font-bold">
            <div className="col-span-5">TOTAL</div>
            <div className="col-span-3 text-right">{formatCurrency(totalPlanned)}</div>
            <div className="col-span-3 text-right">{formatCurrency(totalActual)}</div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
