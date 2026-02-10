import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateSiteDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    location: '',
    description: '',
    map_type: 'uploaded',
    map_image_url: '',
    google_maps_center: null,
    google_maps_zoom: 18
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-updated_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Site.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      toast.success('Site created successfully');
      onOpenChange(false);
      setFormData({ customer_id: '', name: '', location: '', description: '', map_image_url: '' });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, map_image_url: file_url }));
      toast.success('Map uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload map');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a site name');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_id">Customer</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>No customer</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Garden A, Park West, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="123 Main St, City"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this site"
              rows={3}
            />
          </div>

          <div>
            <Label>Map Type</Label>
            <Select
              value={formData.map_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, map_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploaded">Upload Map/Drawing</SelectItem>
                <SelectItem value="google_maps">Use Google Maps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.map_type === 'uploaded' && (
            <div>
              <Label>Site Map / Drawing</Label>
            <div className="mt-2">
              {formData.map_image_url ? (
                <div className="relative">
                  <img
                    src={formData.map_image_url}
                    alt="Site map"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, map_image_url: '' }))}
                    className="absolute top-2 right-2"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {uploading ? 'Uploading...' : 'Click to upload map or drawing'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            )}

          {formData.map_type === 'google_maps' && (
            <div className="space-y-3">
              <Label>Location (Search on Google Maps and copy coordinates)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lat" className="text-xs">Latitude</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    placeholder="51.505"
                    value={formData.google_maps_center?.lat || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      google_maps_center: {
                        ...prev.google_maps_center,
                        lat: parseFloat(e.target.value) || 0
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lng" className="text-xs">Longitude</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    placeholder="-0.09"
                    value={formData.google_maps_center?.lng || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      google_maps_center: {
                        ...prev.google_maps_center,
                        lng: parseFloat(e.target.value) || 0
                      }
                    }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="zoom" className="text-xs">Zoom Level (1-20)</Label>
                <Input
                  id="zoom"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.google_maps_zoom}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_maps_zoom: parseInt(e.target.value) || 18 }))}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Site'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}