'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface AllocationChartProps {
  expenses: number;
  bills: number;
  savings: number;
  debt: number;
}

export function AllocationChart({ expenses, bills, savings, debt }: AllocationChartProps) {
  const total = expenses + bills + savings + debt;

  const data = [
    { name: 'Expenses', value: expenses, percentage: total > 0 ? (expenses / total) * 100 : 0 },
    { name: 'Bills', value: bills, percentage: total > 0 ? (bills / total) * 100 : 0 },
    { name: 'Savings', value: savings, percentage: total > 0 ? (savings / total) * 100 : 0 },
    { name: 'Debt', value: debt, percentage: total > 0 ? (debt / total) * 100 : 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#f9a8d4', '#ddd6fe', '#bfdbfe', '#a7a5b9'];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">
            {payload[0].payload.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="col-span-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-wide">Allocation Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
