import React, { useState, useEffect } from 'react';
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

export default function EditSiteDialog({ open, onOpenChange, site }) {
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
      site_manager: selectedCustomer?.account_manager || '',
      map_type: selectedCustomer?.map_type || 'uploaded'
    }));
  };

  useEffect(() => {
    if (site) {
      setFormData({
        customer_id: site.customer_id || '',
        name: site.name || '',
        project_number: site.project_number || '',
        location: site.location || '',
        description: site.description || '',
        site_manager: site.site_manager || '',
        map_type: site.map_type || 'uploaded',
        map_image_url: site.map_image_url || '',
        google_maps_center: site.google_maps_center || null,
        google_maps_zoom: site.google_maps_zoom || 18
      });
    }
  }, [site]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Site.update(site.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', site.id] });
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      queryClient.invalidateQueries({ queryKey: ['all-sites'] });
      toast.success('Området har uppdaterats');
      onOpenChange(false);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, map_image_url: file_url }));
      toast.success('Kartan har laddats upp');
    } catch (error) {
      toast.error('Kunde inte ladda upp kartan');
    } finally {
      setUploading(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) {
      toast.error('Ange en adress');
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
        toast.success('Plats hittad');
      } else {
        toast.error('Adressen hittades inte');
      }
    } catch (error) {
      toast.error('Kunde inte söka efter adress');
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolokalisering stöds inte av din webbläsare');
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
        toast.success('Aktuell plats angiven');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Kunde inte hämta aktuell plats');
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
      toast.success('Kartan kopierad från området');
    } else if (selectedSite.map_type === 'google_maps' && selectedSite.google_maps_center) {
      setFormData(prev => ({
        ...prev,
        map_type: 'google_maps',
        google_maps_center: selectedSite.google_maps_center,
        google_maps_zoom: selectedSite.google_maps_zoom || 18
      }));
      toast.success('Kartplats kopierad från området');
    } else {
      toast.error('Valt område har ingen karta');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Ange ett områdesnamn');
      return;
    }
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redigera område</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_id">Kund</Label>
            <Select
              value={formData.customer_id}
              onValueChange={handleCustomerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj en kund (valfritt)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Ingen kund</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Områdesnamn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Område A, Park Väst, osv."
              required
            />
          </div>

          <div>
            <Label htmlFor="project_number">Projektnummer</Label>
            <Input
              id="project_number"
              value={formData.project_number}
              onChange={(e) => setFormData(prev => ({ ...prev, project_number: e.target.value }))}
              placeholder="P-001, PRJ-2024, osv."
            />
          </div>

          <div>
            <Label htmlFor="location">Plats</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Storgatan 123, Stad"
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
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ytterligare detaljer om detta område"
              rows={3}
            />
          </div>

          <div>
            <Label>Karttyp</Label>
            <Select
              value={formData.map_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, map_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploaded">Ladda upp karta/ritning</SelectItem>
                <SelectItem value="google_maps">Använd kartfunktion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.customer_id && customerSites.filter(s => s.id !== site?.id && (s.map_image_url || s.google_maps_center)).length > 0 && (
            <div>
              <Label>Eller kopiera karta från befintligt område</Label>
              <Select onValueChange={handleCopyMapFromSite}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj ett område att kopiera kartan från" />
                </SelectTrigger>
                <SelectContent>
                  {customerSites
                    .filter(s => s.id !== site?.id && (s.map_image_url || s.google_maps_center))
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>
                         {s.name} ({s.map_type === 'uploaded' ? 'Bild' : 'Kartfunktion'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.map_type === 'uploaded' && (
            <div>
              <Label>Områdeskarta / Ritning</Label>
              <div className="mt-2">
                {formData.map_image_url ? (
                  <div className="relative">
                    <img
                      src={formData.map_image_url}
                      alt="Områdeskarta"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                     type="button"
                     variant="secondary"
                     size="sm"
                     onClick={() => setFormData(prev => ({ ...prev, map_image_url: '' }))}
                     className="absolute top-2 right-2"
                    >
                     Ändra
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                       {uploading ? 'Laddar upp...' : 'Klicka för att ladda upp karta eller ritning'}
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
                <Label>Sök adress</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Ange adress att söka"
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
                    {searching ? 'Söker...' : 'Sök'}
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
                  {gettingLocation ? 'Hämtar plats...' : 'Använd min aktuella plats'}
                </Button>
              </div>
              <Label className="text-xs text-gray-500">Eller ange koordinater manuellt:</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lat" className="text-xs">Latitud</Label>
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
                   <Label htmlFor="lng" className="text-xs">Longitud</Label>
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
                <Label htmlFor="zoom" className="text-xs">Zoomnivå (1-20)</Label>
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
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || uploading}
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