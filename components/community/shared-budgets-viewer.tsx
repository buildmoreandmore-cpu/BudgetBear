'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users2, Eye, Edit, Calendar, Trash2 } from 'lucide-react';
import { SharedBudgetViewDialog } from './shared-budget-view-dialog';

interface SharedBudget {
  id: string;
  name: string;
  description?: string;
  budgetData: any;
  ownerId: string;
  permissions: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface SharedBudgetsViewerProps {
  ownedBudgets: SharedBudget[];
  sharedBudgets: SharedBudget[];
  currentUserId: string;
  onRefresh?: () => void;
}

export function SharedBudgetsViewer({
  ownedBudgets,
  sharedBudgets,
  currentUserId,
  onRefresh,
}: SharedBudgetsViewerProps) {
  const [selectedBudget, setSelectedBudget] = useState<SharedBudget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPermissionLabel = (budget: SharedBudget) => {
    const permission = budget.permissions[currentUserId];
    return permission === 'edit' ? 'Can Edit' : 'View Only';
  };

  const handleViewBudget = (budget: SharedBudget) => {
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this shared budget? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/share?id=${budgetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete budget');

      alert('Shared budget deleted successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting shared budget:', error);
      alert('Failed to delete shared budget');
    }
  };

  return (
    <Card className="bg-white border-2 border-green-200 rounded-2xl shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Shared Budgets</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budgets shared WITH you */}
        {sharedBudgets.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Shared With You</h4>
            {sharedBudgets.map((budget) => (
              <div
                key={budget.id}
                className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{budget.name}</h5>
                    {budget.description && (
                      <p className="text-xs text-gray-600 mt-1">{budget.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(budget.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        {budget.permissions[currentUserId] === 'edit' ? (
                          <>
                            <Edit className="h-3 w-3" />
                            {getPermissionLabel(budget)}
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            {getPermissionLabel(budget)}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewBudget(budget)}
                    className="ml-2"
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Budgets you've shared with others */}
        {ownedBudgets.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Shared By You</h4>
            {ownedBudgets.map((budget) => (
              <div
                key={budget.id}
                className="bg-green-50 p-3 rounded-lg border-2 border-green-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{budget.name}</h5>
                    {budget.description && (
                      <p className="text-xs text-gray-600 mt-1">{budget.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(budget.createdAt)}
                      </span>
                      <span>
                        Shared with {Object.keys(budget.permissions).length} {Object.keys(budget.permissions).length === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewBudget(budget)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {ownedBudgets.length === 0 && sharedBudgets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No shared budgets yet</p>
            <p className="text-xs">Share a budget with family to collaborate!</p>
          </div>
        )}
      </CardContent>

      {/* View Budget Dialog */}
      {selectedBudget && (
        <SharedBudgetViewDialog
          budget={selectedBudget}
          currentUserId={currentUserId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </Card>
  );
}
