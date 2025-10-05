'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Target, Eye, Calendar, PiggyBank, CreditCard, Users } from 'lucide-react';

export default function BestPractices() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-5xl">🧸</span>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Budgeting Best Practices
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Master your finances with proven strategies from historical analysis and goal-setting
            </p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-8 bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200">
          <CardContent className="pt-6">
            <p className="text-lg text-gray-700 leading-relaxed">
              Successful budgeting isn't just about tracking where your money goes—it's about understanding your spending patterns,
              learning from your financial history, and setting achievable goals for your future. BudgetBear combines historical
              insights with forward-looking goal setting to help you build lasting financial wellness.
            </p>
          </CardContent>
        </Card>

        {/* Section 1: Look Back - Historical Analysis */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-6 w-6 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-800">Look Back: Learn From Your History</h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Track Your Spending Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Why it matters:</strong> Understanding where your money actually goes is the foundation of good budgeting.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Import your bank statements to see a complete picture of your spending</li>
                  <li>Review your transaction history monthly to spot trends</li>
                  <li>Identify your "invisible expenses" - small recurring charges that add up</li>
                  <li>Compare actual spending vs. planned budget to find gaps</li>
                </ul>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                  <p className="text-sm text-blue-900">
                    <strong>🧸 Bear Tip:</strong> Use the History tab to import past statements and see your spending breakdown by category.
                    You might be surprised where your money is really going!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Analyze Spending Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Why it matters:</strong> Patterns reveal opportunities for improvement and help predict future needs.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Review 3-6 months of data to identify seasonal spending patterns</li>
                  <li>Separate fixed costs (rent, insurance) from flexible spending (groceries, entertainment)</li>
                  <li>Track discretionary spending - these are easiest to adjust when needed</li>
                  <li>Notice recurring charges and subscriptions you might have forgotten</li>
                </ul>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-4">
                  <p className="text-sm text-green-900">
                    <strong>🧸 Bear Tip:</strong> BudgetBear automatically categorizes transactions into Fixed, Flexible, and Discretionary.
                    This helps you quickly see which expenses you can control.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Identify Problem Areas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Why it matters:</strong> You can't fix what you don't acknowledge. Historical data shows the truth.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Find categories where you consistently overspend</li>
                  <li>Spot emotional spending triggers (stress, celebrations, etc.)</li>
                  <li>Identify wasteful subscriptions or services you no longer use</li>
                  <li>Notice debt accumulation patterns before they become serious</li>
                </ul>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mt-4">
                  <p className="text-sm text-purple-900">
                    <strong>🧸 Bear Tip:</strong> Use the "Needs Review" counter to check transactions that might need recategorization.
                    This helps ensure your analysis is accurate.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 2: Look Forward - Goal Setting */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-6 w-6 text-pink-600" />
            <h2 className="text-3xl font-bold text-gray-800">Look Forward: Set Achievable Goals</h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-600" />
                  Use Historical Data to Set Realistic Budgets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Why it matters:</strong> Unrealistic budgets lead to frustration and failure. Let your history guide you.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Base your budget on actual spending, not wishful thinking</li>
                  <li>Use your average monthly spending as a starting point</li>
                  <li>Set reduction goals of 5-10% initially, not 50%</li>
                  <li>Build in "buffer" amounts for unexpected expenses based on past surprises</li>
                </ul>
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4">
                  <p className="text-sm text-red-900">
                    <strong>🧸 Bear Tip:</strong> Check the forecast in your spending trends—BudgetBear predicts next month's spending
                    based on your history to help you plan more accurately.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-green-600" />
                  Create SMART Financial Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>SMART Goals:</strong> Specific, Measurable, Achievable, Relevant, Time-bound
                </p>
                <div className="space-y-3 mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-2">❌ Vague Goal:</p>
                    <p className="text-gray-600">"I want to save more money"</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <p className="font-semibold text-green-800 mb-2">✅ SMART Goal:</p>
                    <p className="text-green-700">
                      "I will save $200 per month by reducing discretionary spending by 15% over the next 3 months,
                      building a $600 emergency fund by March."
                    </p>
                  </div>
                </div>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4 mt-4">
                  <li><strong>Specific:</strong> Target a particular category or amount</li>
                  <li><strong>Measurable:</strong> Track progress with actual numbers</li>
                  <li><strong>Achievable:</strong> Based on your historical spending patterns</li>
                  <li><strong>Relevant:</strong> Aligned with your bigger financial priorities</li>
                  <li><strong>Time-bound:</strong> Set a deadline to stay accountable</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Build Accountability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Why it matters:</strong> You're 65% more likely to achieve goals when you share them with someone.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Partner with a friend or family member who also wants to improve their finances</li>
                  <li>Share your monthly progress and challenges</li>
                  <li>Celebrate wins together and problem-solve setbacks</li>
                  <li>Review each other's spending patterns for fresh perspectives</li>
                </ul>
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mt-4">
                  <p className="text-sm text-purple-900">
                    <strong>🧸 Bear Tip:</strong> Use the Community tab to create an accountability partnership.
                    Share budgets, set joint goals, and check in on each other's progress!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Action Steps */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white">🎯 Your Action Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-semibold">Week 1: Look Back</p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-white/90">
                <li>Import 3-6 months of bank statements into BudgetBear</li>
                <li>Review your spending breakdown by category</li>
                <li>Identify your top 3 spending categories</li>
              </ol>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Week 2: Analyze</p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-white/90">
                <li>Calculate your average monthly spending in each category</li>
                <li>Separate fixed, flexible, and discretionary expenses</li>
                <li>Find one expense you can reduce or eliminate</li>
              </ol>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Week 3: Plan Forward</p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-white/90">
                <li>Set a SMART savings goal for next month</li>
                <li>Create a realistic budget based on your actual spending</li>
                <li>Find an accountability partner</li>
              </ol>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">Week 4: Execute & Review</p>
              <ol className="list-decimal list-inside space-y-1 ml-4 text-white/90">
                <li>Track daily spending against your budget</li>
                <li>Review progress weekly with your partner</li>
                <li>Adjust budget based on what's working (or not)</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-200">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Ready to Master Your Finances?</h3>
            <p className="text-gray-600 mb-6">
              Start tracking your spending history and setting achievable goals with BudgetBear today.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
