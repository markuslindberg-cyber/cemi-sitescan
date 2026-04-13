import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UserSelect from '@/components/shared/UserSelect';

export default function EditCustomerDialog({ open, onOpenChange, customer }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    project_number: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    account_manager: '',
    notes: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        category: customer.category || '',
        project_number: customer.project_number || '',
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        account_manager: customer.account_manager || '',
        notes: customer.notes || ''
      });
    }
  }, [customer]);

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.update(customer.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
      toast.success('Kunden har uppdaterats');
      onOpenChange(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Kundnamn krävs');
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Redigera kund</DialogTitle>
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
            <Label>Kategori</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRF">BRF</SelectItem>
                <SelectItem value="Samfälligheter">Samfälligheter</SelectItem>
                <SelectItem value="Kommersiella">Kommersiella</SelectItem>
              </SelectContent>
            </Select>
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
              placeholder="kontakt@exempel.com"
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
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara ändringar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}