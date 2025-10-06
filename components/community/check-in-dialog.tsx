'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, TrendingUp } from 'lucide-react';

interface CheckIn {
  id: string;
  userId: string;
  message: string;
  progress?: number;
  createdAt: string;
}

interface CheckInDialogProps {
  partnershipId: string;
  currentUserId: string;
  onCheckInCreated?: () => void;
}

export function CheckInDialog({ partnershipId, currentUserId, onCheckInCreated }: CheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCheckIns();
    }
  }, [open, partnershipId]);

  const fetchCheckIns = async () => {
    setLoadingCheckIns(true);
    try {
      const response = await fetch(`/api/check-ins?partnershipId=${partnershipId}`);
      if (response.ok) {
        const data = await response.json();
        setCheckIns(data.checkIns || []);
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnershipId,
          message: message.trim(),
          progress: progress ? parseFloat(progress) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create check-in');
      }

      setMessage('');
      setProgress('');
      fetchCheckIns();
      onCheckInCreated?.();
      alert('Check-in posted successfully!');
    } catch (error) {
      console.error('Error creating check-in:', error);
      alert(error instanceof Error ? error.message : 'Failed to create check-in');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Check In
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Accountability Check-In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Post new check-in */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 space-y-3">
            <h3 className="font-semibold text-sm">Post an Update</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your progress, challenges, or wins..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="progress">Progress (optional)</Label>
                <Input
                  id="progress"
                  type="number"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  placeholder="e.g., 75 (for 75%)"
                  min="0"
                  max="100"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Enter a percentage (0-100) if tracking goal progress</p>
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? 'Posting...' : 'Post Check-In'}
              </Button>
            </div>
          </div>

          {/* Check-in history */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Recent Check-Ins</h3>
            {loadingCheckIns ? (
              <p className="text-sm text-gray-500 text-center py-4">Loading...</p>
            ) : checkIns.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No check-ins yet. Be the first to share your progress!
              </p>
            ) : (
              <div className="space-y-3">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className={`p-3 rounded-lg border-2 ${
                      checkIn.userId === currentUserId
                        ? 'bg-green-50 border-green-200'
                        : 'bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600">
                        {checkIn.userId === currentUserId ? 'You' : 'Your Partner'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(checkIn.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{checkIn.message}</p>
                    {checkIn.progress !== null && checkIn.progress !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <TrendingUp className="h-3 w-3" />
                        <span>Progress: {checkIn.progress}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
