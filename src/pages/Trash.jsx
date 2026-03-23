import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

const entityTypeLabels = {
  Inspection: 'Inspektion',
  Site: 'Plats',
  Customer: 'Kund',
  InspectionPoint: 'Inspektionspunkt',
};

const entityMap = {
  Inspection: base44.entities.Inspection,
  Site: base44.entities.Site,
  Customer: base44.entities.Customer,
  InspectionPoint: base44.entities.InspectionPoint,
};

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(new Set());
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' | 'restore' | 'empty'

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trashItems = [], isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: () => base44.entities.Trash.list('-created_date'),
    enabled: currentUser?.role === 'admin',
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === trashItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(trashItems.map(i => i.id)));
    }
  };

  const selectedItems = trashItems.filter(i => selected.has(i.id));

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Trash.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Objekt permanent raderade');
      setSelected(new Set());
      setConfirmAction(null);
    },
  });

  const bulkRestoreMutation = useMutation({
    mutationFn: async (items) => {
      await Promise.all(items.map(async (item) => {
        const entity = entityMap[item.entity_type];
        if (entity && item.entity_data) {
          const { id, created_date, updated_date, created_by, ...restData } = item.entity_data;
          await entity.create(restData);
        }
        await base44.entities.Trash.delete(item.id);
      }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Objekt återställda');
      setSelected(new Set());
      setConfirmAction(null);
    },
  });

  const handleConfirm = () => {
    if (confirmAction === 'delete') {
      bulkDeleteMutation.mutate([...selected]);
    } else if (confirmAction === 'restore') {
      bulkRestoreMutation.mutate(selectedItems);
    } else if (confirmAction === 'empty') {
      bulkDeleteMutation.mutate(trashItems.map(i => i.id));
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Åtkomst nekad</h2>
          <p className="text-gray-600 mt-2">Bara administratörer kan se papperskorgen.</p>
        </div>
      </div>
    );
  }

  const getDaysLeft = (expiresAt) => {
    const diff = new Date(expiresAt) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const allSelected = trashItems.length > 0 && selected.size === trashItems.length;
  const someSelected = selected.size > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trash2 className="w-7 h-7 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Papperskorg</h1>
              <p className="text-sm text-gray-500">Objekt raderas automatiskt efter 30 dagar</p>
            </div>
          </div>
          {trashItems.length > 0 && !someSelected && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmAction('empty')}>
              <Trash2 className="w-4 h-4 mr-2" />
              Töm papperskorg
            </Button>
          )}
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center gap-3 bg-white border rounded-lg px-4 py-3 mb-4 shadow-sm">
            <span className="text-sm text-gray-700 font-medium">{selected.size} markerade</span>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              className="text-green-700 border-green-300 hover:bg-green-50"
              onClick={() => setConfirmAction('restore')}
              disabled={bulkRestoreMutation.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Återställ
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmAction('delete')}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Radera permanent
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : trashItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trash2 className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Papperskorgen är tom</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {/* Select all row */}
            <div className="flex items-center gap-3 px-4 py-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                id="select-all"
              />
              <label htmlFor="select-all" className="text-sm text-gray-600 cursor-pointer select-none">
                Markera alla ({trashItems.length})
              </label>
            </div>

            {trashItems.map((item) => {
              const daysLeft = getDaysLeft(item.expires_at);
              const isChecked = selected.has(item.id);
              return (
                <Card key={item.id} className={`bg-white transition-colors ${isChecked ? 'ring-2 ring-green-400' : ''}`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 truncate">{item.display_name}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {entityTypeLabels[item.entity_type] || item.entity_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span>
                          Raderades {formatDistanceToNow(new Date(item.created_date), { addSuffix: true, locale: sv })}
                        </span>
                        {item.deleted_by && <span>av {item.deleted_by}</span>}
                        <span className={daysLeft <= 3 ? 'text-red-500 font-medium' : ''}>
                          {daysLeft} dagar kvar
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'restore' && 'Återställ objekt?'}
              {confirmAction === 'delete' && 'Radera permanent?'}
              {confirmAction === 'empty' && 'Töm papperskorg?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'restore' && `${selected.size} objekt kommer att återställas.`}
              {confirmAction === 'delete' && `${selected.size} objekt kommer att raderas permanent. Detta kan inte ångras.`}
              {confirmAction === 'empty' && `Alla ${trashItems.length} objekt kommer att raderas permanent. Detta kan inte ångras.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmAction === 'restore' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {confirmAction === 'restore' ? 'Återställ' : 'Radera'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}