import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  color: string;
}

export function SummaryCard({ title, amount, icon: Icon, color }: SummaryCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(amount)}</div>
      </CardContent>
    </Card>
  );
}
