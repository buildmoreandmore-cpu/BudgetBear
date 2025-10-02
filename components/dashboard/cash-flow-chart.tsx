'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface CashFlowChartProps {
  expensesPlanned: number;
  expensesActual: number;
  billsPlanned: number;
  billsActual: number;
  savingsPlanned: number;
  savingsActual: number;
  debtPlanned: number;
  debtActual: number;
}

export function CashFlowChart({
  expensesPlanned,
  expensesActual,
  billsPlanned,
  billsActual,
  savingsPlanned,
  savingsActual,
  debtPlanned,
  debtActual,
}: CashFlowChartProps) {
  const data = [
    {
      name: 'Expenses',
      Planned: expensesPlanned,
      Actual: expensesActual,
    },
    {
      name: 'Bills',
      Planned: billsPlanned,
      Actual: billsActual,
    },
    {
      name: 'Savings',
      Planned: savingsPlanned,
      Actual: savingsActual,
    },
    {
      name: 'Debt',
      Planned: debtPlanned,
      Actual: debtActual,
    },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{payload[0].payload.name}</p>
          <p className="text-sm text-pink-400">
            Planned: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-purple-400">
            Actual: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-wide">Cash Flow Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="category" dataKey="name" />
            <YAxis type="number" tickFormatter={(value) => `$${value}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Planned" fill="#f9a8d4" />
            <Bar dataKey="Actual" fill="#ddd6fe" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
