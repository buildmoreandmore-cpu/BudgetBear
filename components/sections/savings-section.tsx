'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2 } from 'lucide-react';
import { SavingsItem } from '@/types/budget';
import { formatCurrency, calculateProgress } from '@/lib/calculations';
import { useState } from 'react';

interface SavingsSectionProps {
  savings: SavingsItem[];
  onUpdate: (savings: SavingsItem[]) => void;
}

export function SavingsSection({ savings, onUpdate }: SavingsSectionProps) {
  const [newItemName, setNewItemName] = useState('');

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: SavingsItem = {
      id: Date.now().toString(),
      name: newItemName,
      planned: 0,
      actual: 0,
      progress: 0,
    };
    onUpdate([...savings, newItem]);
    setNewItemName('');
  };

  const updateItem = (id: string, field: keyof SavingsItem, value: string | number) => {
    onUpdate(
      savings.map((item) => {
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

  const deleteItem = (id: string) => {
    onUpdate(savings.filter((item) => item.id !== id));
  };

  const totalPlanned = savings.reduce((sum, item) => sum + item.planned, 0);
  const totalActual = savings.reduce((sum, item) => sum + item.actual, 0);

  return (
    <Card className="bg-indigo-50/50">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-wide text-indigo-900">Savings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 font-semibold text-sm text-muted-foreground uppercase">
            <div className="col-span-4">Goal</div>
            <div className="col-span-2 text-right">Planned</div>
            <div className="col-span-2 text-right">Actual</div>
            <div className="col-span-3 text-center">Progress</div>
            <div className="col-span-1"></div>
          </div>

          {savings.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
              <Input
                className="col-span-4 bg-white"
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                placeholder="Savings goal"
              />
              <Input
                className="col-span-2 bg-white text-right"
                type="number"
                step="0.01"
                value={item.planned === 0 ? '' : item.planned}
                onChange={(e) => updateItem(item.id, 'planned', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <Input
                className="col-span-2 bg-white text-right"
                type="number"
                step="0.01"
                value={item.actual === 0 ? '' : item.actual}
                onChange={(e) => updateItem(item.id, 'actual', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <div className="col-span-3 flex items-center gap-2">
                <Progress value={item.progress} className="flex-1" />
                <span className="text-xs font-medium w-12 text-right">{item.progress}%</span>
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

          <div className="flex gap-2">
            <Input
              placeholder="Add new savings goal"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="bg-white"
            />
            <Button onClick={addItem} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-12 gap-4 pt-4 border-t font-bold">
            <div className="col-span-4">TOTAL</div>
            <div className="col-span-2 text-right">{formatCurrency(totalPlanned)}</div>
            <div className="col-span-2 text-right">{formatCurrency(totalActual)}</div>
            <div className="col-span-3"></div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
