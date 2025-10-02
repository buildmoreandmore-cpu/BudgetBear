'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface AmountLeftCardProps {
  amountLeft: number;
  totalIncome: number;
}

export function AmountLeftCard({ amountLeft, totalIncome }: AmountLeftCardProps) {
  const spent = totalIncome - amountLeft;
  const percentageLeft = totalIncome > 0 ? (amountLeft / totalIncome) * 100 : 0;

  const data = [
    { name: 'Spent', value: spent },
    { name: 'Remaining', value: amountLeft },
  ];

  const COLORS = ['#e5e7eb', '#f9a8d4'];

  return (
    <Card className="col-span-full lg:col-span-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-center uppercase tracking-wide">Amount Left to Spend</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        <div className="relative w-64 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold">{formatCurrency(amountLeft)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {percentageLeft.toFixed(1)}% remaining
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
