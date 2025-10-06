'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { DebtItem } from '@/types/budget';
import { formatCurrency, calculateProgress } from '@/lib/calculations';
import { useState } from 'react';

interface DebtSectionProps {
  debt: DebtItem[];
  onUpdate: (debt: DebtItem[]) => void;
}

export function DebtSection({ debt, onUpdate }: DebtSectionProps) {
  const [newItemName, setNewItemName] = useState('');

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: DebtItem = {
      id: Date.now().toString(),
      name: newItemName,
      planned: 0,
      actual: 0,
      progress: 0,
      completed: false,
    };
    onUpdate([...debt, newItem]);
    setNewItemName('');
  };

  const updateItem = (id: string, field: keyof DebtItem, value: string | number | boolean) => {
    onUpdate(
      debt.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'actual' || field === 'planned') {
            updated.progress = calculateProgress(updated.actual, updated.planned);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const toggleCompleted = (id: string) => {
    onUpdate(
      debt.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    onUpdate(debt.filter((item) => item.id !== id));
  };

  const totalPlanned = debt.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = debt.reduce((sum, item) => sum + item.actual, 0);

  return (
    <Card className="bg-slate-50/50">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-wide text-slate-900">Debt</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2 md:gap-4 font-semibold text-xs md:text-sm text-muted-foreground uppercase">
            <div className="col-span-1"></div>
            <div className="col-span-4">Debt Name</div>
            <div className="col-span-2 text-right">Plan</div>
            <div className="col-span-2 text-right">Actual</div>
            <div className="col-span-2 text-center"><span className="hidden md:inline">Progress</span><span className="md:hidden">%</span></div>
            <div className="col-span-1"></div>
          </div>

          {debt.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 md:gap-4 items-center">
              <Button
                variant="ghost"
                size="icon"
                className="col-span-1"
                onClick={() => toggleCompleted(item.id)}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300" />
                )}
              </Button>
              <Input
                className="col-span-4 bg-white"
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextInput = e.currentTarget.parentElement?.querySelector('input[type="number"]') as HTMLInputElement;
                    nextInput?.focus();
                  }
                }}
                placeholder="Debt name"
              />
              <Input
                className="col-span-2 bg-white text-right"
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
                className="col-span-2 bg-white text-right"
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
              <div className="col-span-2 flex items-center gap-2">
                <Progress value={item.progress} className="flex-1" />
                <span className="text-xs font-medium">{item.progress}%</span>
              </div>
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
              placeholder="Add new debt"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="col-span-11 bg-white"
            />
            <Button onClick={addItem} size="icon" className="col-span-1">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-3 md:gap-4 pt-4 border-t font-bold">
            <div className="col-span-1"></div>
            <div className="col-span-4">TOTAL</div>
            <div className="col-span-2 text-right text-[10px] sm:text-xs">{formatCurrency(totalPlanned)}</div>
            <div className="col-span-2 text-right text-[10px] sm:text-xs">{formatCurrency(totalActual)}</div>
            <div className="col-span-2"></div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
