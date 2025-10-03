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

  // Calculate max value for dynamic scaling
  const maxValue = Math.max(
    expensesPlanned, expensesActual,
    billsPlanned, billsActual,
    savingsPlanned, savingsActual,
    debtPlanned, debtActual
  );

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { name: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{payload[0].payload.name}</p>
          <p className="text-sm text-pink-300">
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
    <Card className="col-span-full hover:shadow-lg transition-shadow bg-gradient-to-br from-gray-50 to-gray-100">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-[0.2em] font-normal text-gray-700">Cash Flow Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6 flex justify-center gap-6 items-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-pink-300 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-400 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Actual</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ left: 80, right: 60, top: 10, bottom: 10 }} barGap={-8}>
            <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical={true} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, maxValue * 1.1]}
              tickFormatter={(value) => value.toLocaleString()}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              stroke="none"
              tick={{ fill: '#374151', fontSize: 14 }}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Planned" fill="#f9a8d4" radius={[0, 4, 4, 0]} barSize={20} />
            <Bar dataKey="Actual" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
