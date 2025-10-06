'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckInDialog } from './check-in-dialog';

interface Partnership {
  id: string;
  partnerId: string;
  goalType: string;
  goalTarget?: number;
  active: boolean;
}

interface PartnerRequest {
  id: string;
  fromUserId: string;
  message?: string;
  status: string;
}

interface PartnerCardProps {
  partnerships: Partnership[];
  receivedRequests: PartnerRequest[];
  currentUserId: string;
  onRefresh: () => void;
}

export function PartnerCard({ partnerships, receivedRequests, currentUserId, onRefresh }: PartnerCardProps) {
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!partnerEmail) {
      alert('Please enter a partner email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserEmail: partnerEmail,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send partner request');
      }

      alert('Partner request sent successfully!');
      setShowAddPartner(false);
      setPartnerEmail('');
      setMessage('');
      onRefresh();
    } catch (error) {
      console.error('Error sending partner request:', error);
      alert(error instanceof Error ? error.message : 'Failed to send partner request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action: 'accept',
          goalType: 'savings',
        }),
      });

      if (!response.ok) throw new Error('Failed to accept request');

      alert('Partnership accepted!');
      onRefresh();
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleDeletePartnership = async (partnershipId: string) => {
    if (!confirm('Are you sure you want to remove this accountability partner?')) {
      return;
    }

    try {
      const response = await fetch(`/api/partners?partnershipId=${partnershipId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete partnership');

      alert('Partnership removed successfully');
      onRefresh();
    } catch (error) {
      console.error('Error deleting partnership:', error);
      alert('Failed to delete partnership');
    }
  };

  return (
    <Card className="bg-white border-2 border-blue-200 rounded-2xl shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Accountability Partners</CardTitle>
          </div>
          <Button
            onClick={() => setShowAddPartner(!showAddPartner)}
            size="sm"
            variant="outline"
            className="bg-blue-50 border-blue-300 hover:bg-blue-100"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Partner
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddPartner && (
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="partner-email">Partner Email</Label>
              <Input
                id="partner-email"
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Let's help each other achieve our goals!"
              />
            </div>
            <Button onClick={handleSendRequest} disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        )}

        {receivedRequests.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Pending Requests</h4>
            {receivedRequests.map((request) => (
              <div key={request.id} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm mb-2">{request.message || 'Someone wants to be your accountability partner!'}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleAcceptRequest(request.id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline">
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {partnerships.length > 0 ? (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-gray-700">Active Partnerships</h4>
            {partnerships.map((partnership) => (
              <div key={partnership.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Partner ID: {partnership.partnerId.slice(0, 8)}...</p>
                      <p className="text-xs text-gray-600">Goal: {partnership.goalType}</p>
                      {partnership.goalTarget && (
                        <p className="text-xs text-gray-600">Target: ${partnership.goalTarget}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CheckInDialog
                      partnershipId={partnership.id}
                      currentUserId={currentUserId}
                      onCheckInCreated={onRefresh}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeletePartnership(partnership.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No active partnerships yet</p>
            <p className="text-xs">Add a partner to stay accountable!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
