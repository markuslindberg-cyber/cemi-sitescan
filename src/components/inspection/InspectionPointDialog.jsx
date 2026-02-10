import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2, Trash2, MapPin, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const issueTypes = [
  { value: 'improvement_suggestions', label: 'Improvement Suggestions' },
  { value: 'issue_damage', label: 'Issue/Damage' },
  { value: 'plant_health', label: 'Plant Health' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'safety_concern', label: 'Safety Concern' }
];

const severityLevels = [
  { value: 'low', label: 'Low', color: 'text-blue-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' }
];

export default function InspectionPointDialog({ open, onOpenChange, inspectionId, position, existingPoint }) {
  const [formData, setFormData] = useState({
    issue_type: 'maintenance',
    severity: 'medium',
    notes: '',
    photo_details: [],
    latitude: null,
    longitude: null
  });
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (existingPoint) {
      setFormData({
        issue_type: existingPoint.issue_type || 'maintenance',
        severity: existingPoint.severity || 'medium',
        notes: existingPoint.notes || '',
        photo_details: existingPoint.photo_details || [],
        latitude: existingPoint.latitude || null,
        longitude: existingPoint.longitude || null
      });
    } else {
      setFormData({
        issue_type: 'maintenance',
        severity: 'medium',
        notes: '',
        photo_details: [],
        latitude: position?.latitude || null,
        longitude: position?.longitude || null
      });
    }
  }, [existingPoint, open, position]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InspectionPoint.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-points'] });
      toast.success('Inspection point added');
      onOpenChange(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InspectionPoint.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-points'] });
      toast.success('Inspection point updated');
      onOpenChange(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InspectionPoint.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-points'] });
      toast.success('Inspection point deleted');
      onOpenChange(false);
    }
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newPhotos = results.map(r => ({ url: r.file_url, comment: '' }));
      setFormData(prev => ({
        ...prev,
        photo_details: [...prev.photo_details, ...newPhotos]
      }));
      toast.success(`${files.length} photo(s) uploaded`);
    } catch (error) {
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_details: prev.photo_details.filter((_, i) => i !== index)
    }));
  };

  const updatePhotoComment = (index, comment) => {
    setFormData(prev => ({
      ...prev,
      photo_details: prev.photo_details.map((photo, i) =>
        i === index ? { ...photo, comment } : photo
      )
    }));
  };

  const togglePhotoAddress = (index) => {
    setFormData(prev => ({
      ...prev,
      photo_details: prev.photo_details.map((photo, i) =>
        i === index ? { ...photo, show_address: !photo.show_address } : photo
      )
    }));
  };

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      return data.address?.road || data.address?.suburb || data.address?.city || 'Unknown location';
    } catch (error) {
      return 'Unknown location';
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const address = await getAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
        
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_address: address
        }));
        toast.success('Location captured');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Failed to get location');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (existingPoint) {
      updateMutation.mutate({
        id: existingPoint.id,
        data: formData
      });
    } else {
      if (!position) return;
      
      const pointData = {
        inspection_id: inspectionId,
        ...formData
      };
      
      // Handle coordinates based on map type
      if (position.latitude !== undefined && position.longitude !== undefined) {
        // Google Maps mode
        pointData.x_position = 0;
        pointData.y_position = 0;
      } else if (position.x !== undefined && position.y !== undefined) {
        // Uploaded image mode
        pointData.x_position = position.x;
        pointData.y_position = position.y;
      }
      
      createMutation.mutate(pointData);
    }
  };

  const handleDelete = () => {
    if (existingPoint && confirm('Are you sure you want to delete this inspection point?')) {
      deleteMutation.mutate(existingPoint.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingPoint ? 'Edit Inspection Point' : 'Add Inspection Point'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="issue_type">Issue Type</Label>
              <Select
                value={formData.issue_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, issue_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {issueTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className={level.color}>{level.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Describe the issue in detail..."
              rows={4}
            />
          </div>

          <div>
            <Label>GPS Coordinates</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="flex-1"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {gettingLocation ? 'Getting location...' : 'Capture Current Location'}
              </Button>
            </div>
            {formData.latitude && formData.longitude && (
              <div className="mt-2 space-y-2">
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  Lat: {formData.latitude.toFixed(6)}, Long: {formData.longitude.toFixed(6)}
                </div>
                {formData.location_address && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    📍 {formData.location_address}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label>Photos</Label>
            <div className="mt-2 space-y-3">
              {formData.photo_details.length > 0 && (
                <div className="space-y-4">
                  {formData.photo_details.map((photo, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="relative group mb-2">
                        <img
                          src={photo.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <Textarea
                        placeholder="Add a comment for this photo (optional)..."
                        value={photo.comment}
                        onChange={(e) => updatePhotoComment(index, e.target.value)}
                        rows={2}
                        className="text-sm mb-3"
                      />
                      {formData.location_address && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                          <Checkbox
                            checked={photo.show_address || false}
                            onCheckedChange={() => togglePhotoAddress(index)}
                          />
                          <span className="text-gray-700">Show location ({formData.location_address}) in report</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Click to upload photos'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4">
            {existingPoint && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || uploading}
                className="bg-green-600 hover:bg-green-700"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : existingPoint ? (
                  'Update Point'
                ) : (
                  'Add Point'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}