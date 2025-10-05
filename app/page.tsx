'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SignInModal } from '@/components/auth/sign-in-modal';
import { useAuth } from '@/components/auth/auth-provider';
import { Sparkles, BarChart3, Calendar, Download, Users, Target } from 'lucide-react';

export default function Home() {
  const [showSignIn, setShowSignIn] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return null;
  }

  if (user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-7xl">🧸</span>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              BudgetBear
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-700 mb-4">
            Bear down on your finances
          </p>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Track income, expenses, and savings across multiple months and years.
            Get AI-powered insights to make better financial decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              onClick={() => setShowSignIn(true)}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg px-8 py-6"
            >
              Get Started Free
            </Button>
            <Button
              onClick={() => setShowSignIn(true)}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 border-purple-300 hover:bg-purple-50"
            >
              Sign In
            </Button>
          </div>
          <div className="text-center">
            <Button
              onClick={() => router.push('/best-practices')}
              variant="link"
              className="text-purple-600 hover:text-purple-700 underline"
            >
              📚 Learn Budgeting Best Practices →
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">AI-Powered Insights</h3>
            <p className="text-gray-600">
              Get personalized budget recommendations and financial advice powered by Claude AI.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-pink-200">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Multi-Year Tracking</h3>
            <p className="text-gray-600">
              Track your budget across all 12 months and multiple years. See your progress over time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Visual Analytics</h3>
            <p className="text-gray-600">
              Beautiful charts and graphs to visualize your spending patterns and cash flow.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Export Anywhere</h3>
            <p className="text-gray-600">
              Export your budget to Excel, PDF, Word, or JSON. Your data, your way.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Community Features</h3>
            <p className="text-gray-600">
              Share budgets with family and connect with accountability partners (coming soon).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-pink-200">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Goal Tracking</h3>
            <p className="text-gray-600">
              Set savings goals, track debt payments, and monitor your progress toward financial freedom.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to take control of your finances?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join BudgetBear today and start building better financial habits.
          </p>
          <Button
            onClick={() => setShowSignIn(true)}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6"
          >
            Start Budgeting Now
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            Made with 🧸 by BudgetBear • Your friendly budget companion
          </p>
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal open={showSignIn} onClose={() => setShowSignIn(false)} />
    </main>
  );
}
