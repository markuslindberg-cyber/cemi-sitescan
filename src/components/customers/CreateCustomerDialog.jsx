import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UserSelect from '@/components/shared/UserSelect';

export default function CreateCustomerDialog({ open, onOpenChange, customer }) {
  const [formData, setFormData] = useState({
    name: '',
    project_number: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    account_manager: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunden har skapats');
      onOpenChange(false);
      setFormData({
        name: '',
        project_number: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        account_manager: '',
        notes: ''
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Kundnamn krävs');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till kund</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Kundnamn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Företag eller kundnamn"
            />
          </div>

          <div>
            <Label htmlFor="project_number">Projektnummer</Label>
            <Input
              id="project_number"
              value={formData.project_number}
              onChange={(e) => setFormData(prev => ({ ...prev, project_number: e.target.value }))}
              placeholder="Projektreferensnummer"
            />
          </div>

          <div>
            <Label htmlFor="contact_person">Kontaktperson</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              placeholder="Namn på huvudkontakt"
            />
          </div>

          <div>
            <Label htmlFor="email">E-post</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contact@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+46 123 456 789"
            />
          </div>

          <div>
            <Label htmlFor="address">Adress</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Gatuadress, stad, postnummer"
              rows={2}
            />
          </div>

          <div>
            <Label>Kundansvarig</Label>
            <UserSelect
              value={formData.account_manager}
              onValueChange={(v) => setFormData(prev => ({ ...prev, account_manager: v }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ytterligare information..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Skapar...
                </>
              ) : (
                'Skapa kund'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}