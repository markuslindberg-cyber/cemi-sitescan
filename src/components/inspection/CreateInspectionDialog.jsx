import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

const reasonCategories = [
  { value: 'tillsyn', label: 'Tillsyn' },
  { value: 'besiktning', label: 'Besiktning' },
  { value: 'ny_kundbesiktning', label: 'Ny kundbesiktning' },
  { value: 'anbud_kalkylering', label: 'Anbud/kalkylering' },
  { value: 'egenkontroll', label: 'Egenkontroll' },
  { value: 'other', label: 'Annat' }
];

export default function CreateInspectionDialog({ open, onOpenChange, onConfirm, isLoading }) {
  const [reason_category, setReasonCategory] = useState('egenkontroll');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ reason_category, notes });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-sm gap-3 p-4">
        <DialogHeader>
          <DialogTitle>Starta ny inspektion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label>Anledning för inspektion</Label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={reason_category}
              onChange={(e) => setReasonCategory(e.target.value)}
            >
              {reasonCategories.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Inspektionsanteckningar</Label>
            <Textarea
              className="mt-1"
              placeholder="Lägg till allmänna anteckningar om inspektionen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skapar...
                </>
              ) : (
                'Starta inspektion'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}