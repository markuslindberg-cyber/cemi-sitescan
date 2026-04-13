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
import UserSelect from '@/components/shared/UserSelect';

export default function CreateSiteDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    project_number: '',
    location: '',
    description: '',
    site_manager: '',
    map_type: 'uploaded',
    map_image_url: '',
    google_maps_center: null,
    google_maps_zoom: 18
  });
  const [uploading, setUploading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-updated_date')
  });

  const { data: customerSites = [] } = useQuery({
    queryKey: ['customer-sites', formData.customer_id],
    queryFn: () => base44.entities.Site.filter({ customer_id: formData.customer_id }),
    enabled: !!formData.customer_id
  });

  const handleCustomerChange = (customerId) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      project_number: selectedCustomer?.project_number || prev.project_number,
      site_manager: selectedCustomer?.account_manager || '',
      map_type: selectedCustomer?.map_type || 'uploaded'
    }));
  };

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

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      toast.error('Please enter an address');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({
          ...prev,
          google_maps_center: {
            lat: parseFloat(lat),
            lng: parseFloat(lon)
          }
        }));
        toast.success('Location found');
      } else {
        toast.error('Address not found');
      }
    } catch (error) {
      toast.error('Failed to search address');
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          google_maps_center: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        toast.success('Current location set');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Failed to get current location');
        setGettingLocation(false);
      }
    );
  };

  const handleCopyMapFromSite = (siteId) => {
    const selectedSite = customerSites.find(s => s.id === siteId);
    if (!selectedSite) return;

    if (selectedSite.map_type === 'uploaded' && selectedSite.map_image_url) {
      setFormData(prev => ({
        ...prev,
        map_type: 'uploaded',
        map_image_url: selectedSite.map_image_url
      }));
      toast.success('Map copied from site');
    } else if (selectedSite.map_type === 'google_maps' && selectedSite.google_maps_center) {
      setFormData(prev => ({
        ...prev,
        map_type: 'google_maps',
        google_maps_center: selectedSite.google_maps_center,
        google_maps_zoom: selectedSite.google_maps_zoom || 18
      }));
      toast.success('Map location copied from site');
    } else {
      toast.error('Selected site has no map');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a site name');
      return;
    }

    try {
      let customerId = formData.customer_id;

      if (isNewCustomer && newCustomerName.trim()) {
        const newCustomer = await base44.entities.Customer.create({ name: newCustomerName.trim() });
        customerId = newCustomer.id;
      }

      createMutation.mutate({ ...formData, customer_id: customerId });
    } catch (error) {
      toast.error('Failed to create customer');
    }
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
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={!isNewCustomer ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewCustomer(false)}
                className="flex-1"
              >
                Select Existing
              </Button>
              <Button
                type="button"
                variant={isNewCustomer ? "default" : "outline"}
                size="sm"
                onClick={() => setIsNewCustomer(true)}
                className="flex-1"
              >
                Create New
              </Button>
            </div>
            {isNewCustomer ? (
              <Input
                placeholder="Enter new customer name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
              />
            ) : (
              <Select
                value={formData.customer_id}
                onValueChange={handleCustomerChange}
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
            )}
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
            <Label htmlFor="project_number">Project Number</Label>
            <Input
              id="project_number"
              value={formData.project_number}
              onChange={(e) => setFormData(prev => ({ ...prev, project_number: e.target.value }))}
              placeholder="P-001, PRJ-2024, etc."
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
            <Label>Platsansvarig</Label>
            <UserSelect
              value={formData.site_manager}
              onValueChange={(v) => setFormData(prev => ({ ...prev, site_manager: v }))}
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
                <SelectItem value="google_maps">Use Apple Maps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.customer_id && customerSites.length > 0 && (
            <div>
              <Label>Or Copy Map from Existing Site</Label>
              <Select onValueChange={handleCopyMapFromSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a site to copy map from" />
                </SelectTrigger>
                <SelectContent>
                  {customerSites
                    .filter(s => s.map_image_url || s.google_maps_center)
                    .map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} ({site.map_type === 'uploaded' ? 'Image' : 'Apple Maps'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            </div>
          )}

          {formData.map_type === 'google_maps' && (
            <div className="space-y-3">
              <div>
                <Label>Search Address</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Enter address to search"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSearchAddress}
                    disabled={searching}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full"
                >
                  {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                </Button>
              </div>
              <Label className="text-xs text-gray-500">Or enter coordinates manually:</Label>
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