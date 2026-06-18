import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, ImageIcon, Map } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const reasonCategories = [
  { value: 'tillsyn', label: 'Tillsyn' },
  { value: 'besiktning', label: 'Besiktning' },
  { value: 'ny_kundbesiktning', label: 'Ny kundbesiktning' },
  { value: 'anbud_kalkylering', label: 'Anbud/kalkylering' },
  { value: 'egenkontroll', label: 'Egenkontroll' },
  { value: 'fore_bilder', label: 'Före bilder' },
  { value: 'efterbilder', label: 'Efterbilder' },
  { value: 'other', label: 'Annat' }
];

// mapOption: 'site' | 'last' | 'upload'
export default function CreateInspectionDialog({ open, onOpenChange, onConfirm, isLoading, site, previousMapUrl }) {
  const [reason_category, setReasonCategory] = useState('egenkontroll');
  const [notes, setNotes] = useState('');
  const [mapOption, setMapOption] = useState('site');
  const [uploadedMapUrl, setUploadedMapUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const hasUploadedMap = !!site?.map_image_url;
  const hasPreviousMap = !!previousMapUrl && previousMapUrl !== site?.map_image_url;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedMapUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let map_image_url = null;
    if (mapOption === 'last' && previousMapUrl) map_image_url = previousMapUrl;
    else if (mapOption === 'upload' && uploadedMapUrl) map_image_url = uploadedMapUrl;
    // 'site' means no override — use site's map
    onConfirm({ reason_category, notes, map_image_url });
  };

  const handleClose = () => {
    setUploadedMapUrl(null);
    setMapOption('site');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
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

          {/* Map selection — only for uploaded map type sites */}
          {site?.map_type !== 'google_maps' && (
            <div>
              <Label>Karta för inspektionen</Label>
              <div className="mt-2 space-y-2">
                {hasUploadedMap && (
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mapOption === 'site' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="mapOption" value="site" checked={mapOption === 'site'} onChange={() => setMapOption('site')} className="hidden" />
                    <Map className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Befintlig platskarta</p>
                      <p className="text-xs text-gray-500">Använd kartan som är kopplad till platsen</p>
                    </div>
                  </label>
                )}

                {hasPreviousMap && (
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mapOption === 'last' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="mapOption" value="last" checked={mapOption === 'last'} onChange={() => setMapOption('last')} className="hidden" />
                    <ImageIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Senast uppladdade karta</p>
                      <p className="text-xs text-gray-500">Från föregående inspektion</p>
                    </div>
                  </label>
                )}

                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${mapOption === 'upload' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="mapOption" value="upload" checked={mapOption === 'upload'} onChange={() => setMapOption('upload')} className="hidden" />
                  <Upload className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Ladda upp ny karta</p>
                    <p className="text-xs text-gray-500">Välj en egen bild för denna inspektion</p>
                  </div>
                </label>

                {mapOption === 'upload' && (
                  <div className="pl-2">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full">
                      {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Laddar upp...</> : uploadedMapUrl ? '✓ Karta uppladdad – byt fil' : 'Välj bildfil'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <Label>Inspektionsanteckningar</Label>
            <Textarea
              className="mt-1"
              placeholder="Lägg till allmänna anteckningar om inspektionen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading || (mapOption === 'upload' && !uploadedMapUrl) || uploading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Skapar...</>
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