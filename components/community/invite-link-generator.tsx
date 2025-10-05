'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Link2, CheckCircle2 } from 'lucide-react';

export function InviteLinkGenerator() {
  const [type, setType] = useState<'partner' | 'budget' | 'both'>('partner');
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [generating, setGenerating] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message || null,
          expiresInDays: parseInt(expiresInDays),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to generate invitation link');
        setGenerating(false);
        return;
      }

      setInviteLink(data.invitation.link);
    } catch (error) {
      alert('Failed to generate invitation link');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-purple-600" />
          <CardTitle>Create Invitation Link</CardTitle>
        </div>
        <CardDescription>
          Generate a shareable link to invite someone to become your accountability partner or share a budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Invitation Type</Label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="partner">Accountability Partner Only</SelectItem>
              <SelectItem value="budget">Budget Sharing Only</SelectItem>
              <SelectItem value="both">Partner + Budget Sharing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Expires In (Days)</Label>
          <Select value={expiresInDays} onValueChange={setExpiresInDays}>
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Day</SelectItem>
              <SelectItem value="3">3 Days</SelectItem>
              <SelectItem value="7">7 Days (Default)</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Personal Message (Optional)</Label>
          <Textarea
            className="bg-white"
            placeholder="Add a personal message to your invitation..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {generating ? 'Generating...' : 'Generate Invitation Link'}
        </Button>

        {inviteLink && (
          <div className="mt-4 p-4 bg-white border-2 border-purple-200 rounded-lg space-y-3">
            <Label>Your Invitation Link</Label>
            <div className="flex gap-2">
              <Input
                className="flex-1 font-mono text-sm"
                value={inviteLink}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with someone to invite them to BudgetBear. They'll automatically become your partner when they sign up!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
