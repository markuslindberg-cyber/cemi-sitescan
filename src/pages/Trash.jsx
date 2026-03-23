import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
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

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [showEmptyDialog, setShowEmptyDialog] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trashItems = [], isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: () => base44.entities.Trash.list('-created_date'),
    enabled: currentUser?.role === 'admin',
  });

  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(trashItems.map(item => base44.entities.Trash.delete(item.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Papperskorgen tömd');
      setShowEmptyDialog(false);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.Trash.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      toast.success('Objekt permanent raderat');
    },
  });

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
          {trashItems.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmptyDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Töm papperskorg
            </Button>
          )}
        </div>

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
          <div className="space-y-3">
            {trashItems.map((item) => {
              const daysLeft = getDaysLeft(item.expires_at);
              return (
                <Card key={item.id} className="bg-white">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
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
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 ml-2"
                      onClick={() => deleteItemMutation.mutate(item.id)}
                      disabled={deleteItemMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={showEmptyDialog} onOpenChange={setShowEmptyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Töm papperskorg?</AlertDialogTitle>
            <AlertDialogDescription>
              Alla {trashItems.length} objekt kommer att raderas permanent. Detta kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emptyTrashMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Töm papperskorg
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}