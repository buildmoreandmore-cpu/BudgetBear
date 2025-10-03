'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { MonthlyBudget } from '@/types/budget';

interface Insight {
  type: 'success' | 'warning' | 'info' | 'opportunity';
  title: string;
  message: string;
  icon: string;
}

interface InsightsPanelProps {
  budgetData: MonthlyBudget;
  month: string;
  year: number;
}

export function InsightsPanel({ budgetData, month, year }: InsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          budgetData,
          month,
          year,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      setError('Failed to generate insights. Please try again.');
      console.error('Error generating insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'opportunity':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-purple-50 border-purple-200 text-purple-800';
    }
  };

  return (
    <Card className="bg-white border-2 border-purple-200 rounded-2xl shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">🐻 Bear&apos;s AI Insights</CardTitle>
          </div>
          <Button
            onClick={generateInsights}
            disabled={loading}
            size="sm"
            variant="outline"
            className="bg-purple-50 border-purple-300 hover:bg-purple-100"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analyzing...' : 'Get Insights'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
            {error}
          </div>
        )}

        {insights.length === 0 && !error && !loading && (
          <div className="text-center py-12 px-4 text-muted-foreground bg-purple-50 rounded-xl">
            <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-300" />
            <p className="text-sm">Click &quot;Get Insights&quot; to receive personalized financial advice from BudgetBear!</p>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border-2 ${getTypeColor(insight.type)}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl flex-shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold mb-0.5 text-sm">{insight.title}</h4>
                    <p className="text-xs leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
