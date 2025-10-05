'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TrendsCardProps {
  category?: string;
  subcategory?: string;
  spendingType?: string;
}

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

interface TrendsData {
  monthlySummary: MonthlyData[];
  statistics: {
    average: number;
    min: number;
    max: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    dataPoints: number;
  };
  forecast: {
    nextMonth: number;
    confidence: number;
  };
  spendingBreakdown: {
    fixed: number;
    flexible: number;
    discretionary: number;
    total: number;
  };
}

export function TrendsCard({ category, subcategory, spendingType }: TrendsCardProps) {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          months: '12',
          ...(category && { category }),
          ...(subcategory && { subcategory }),
          ...(spendingType && { spendingType }),
        });

        const response = await fetch(`/api/transactions/trends?${params}`);
        const data = await response.json();

        if (data.success) {
          setTrends(data.trends);
        }
      } catch (error) {
        console.error('[Trends Card] Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [category, subcategory, spendingType]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">Loading trends...</div>
        </CardContent>
      </Card>
    );
  }

  if (!trends || trends.monthlySummary.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Not enough data to show trends. Import more transactions to see analysis.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { statistics, forecast } = trends;

  // Format data for chart
  const chartData = trends.monthlySummary.map(item => ({
    month: item.month,
    spending: item.total,
  }));

  // Add forecast to chart
  if (forecast.nextMonth > 0) {
    const lastMonth = trends.monthlySummary[trends.monthlySummary.length - 1]?.month;
    const nextMonth = getNextMonth(lastMonth);
    chartData.push({
      month: nextMonth,
      spending: forecast.nextMonth,
    });
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Trend Overview */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">📈 Spending Trends & Forecast</CardTitle>
              <CardDescription>
                Analysis of {category || 'all'} spending over the last {statistics.dataPoints} months
              </CardDescription>
            </div>
            <div className="text-right">
              {statistics.trend === 'increasing' && (
                <div className="flex items-center gap-2 text-red-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-semibold">Increasing</span>
                </div>
              )}
              {statistics.trend === 'decreasing' && (
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingDown className="h-5 w-5" />
                  <span className="font-semibold">Decreasing</span>
                </div>
              )}
              {statistics.trend === 'stable' && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Activity className="h-5 w-5" />
                  <span className="font-semibold">Stable</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Average</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(statistics.average)}
              </div>
            </div>

            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Min</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(statistics.min)}
              </div>
            </div>

            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Max</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(statistics.max)}
              </div>
            </div>

            <div className="bg-white/80 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Next Month Forecast</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(forecast.nextMonth)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {forecast.confidence.toFixed(0)}% confidence
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white/80 p-4 rounded-lg">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spending"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const nextDate = new Date(year, month, 1); // month is already 0-indexed from the split
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}
