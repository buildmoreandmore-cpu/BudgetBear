'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2 } from 'lucide-react';
import { MonthlyBudget } from '@/types/budget';

interface ShareBudgetDialogProps {
  budgetData: MonthlyBudget;
  month: string;
  year: number;
}

export function ShareBudgetDialog({ budgetData, month, year }: ShareBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${month} ${year} Budget`);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          budgetData,
          sharedWithEmail: email,
          permission,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to share budget');
      }

      alert('Budget shared successfully!');
      setOpen(false);
      setEmail('');
      setDescription('');
    } catch (error) {
      console.error('Error sharing budget:', error);
      alert(error instanceof Error ? error.message : 'Failed to share budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Budget with Family</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter budget name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Share with (email)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="family@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="permission">Permission</Label>
            <select
              id="permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="view">View Only</option>
              <option value="edit">Can Edit</option>
            </select>
          </div>
          <Button onClick={handleShare} disabled={loading} className="w-full">
            {loading ? 'Sharing...' : 'Share Budget'}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            🧸 Share your budget with family members to collaborate on financial planning together!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
