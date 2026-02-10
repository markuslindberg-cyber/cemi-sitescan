import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const issueTypes = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'damage', label: 'Damage' },
  { value: 'pest', label: 'Pest' },
  { value: 'disease', label: 'Disease' },
  { value: 'safety', label: 'Safety' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'plant_health', label: 'Plant Health' },
  { value: 'other', label: 'Other' }
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
    photo_urls: []
  });
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (existingPoint) {
      setFormData({
        issue_type: existingPoint.issue_type || 'maintenance',
        severity: existingPoint.severity || 'medium',
        notes: existingPoint.notes || '',
        photo_urls: existingPoint.photo_urls || []
      });
    } else {
      setFormData({
        issue_type: 'maintenance',
        severity: 'medium',
        notes: '',
        photo_urls: []
      });
    }
  }, [existingPoint, open]);

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
      const newUrls = results.map(r => r.file_url);
      setFormData(prev => ({
        ...prev,
        photo_urls: [...prev.photo_urls, ...newUrls]
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
      photo_urls: prev.photo_urls.filter((_, i) => i !== index)
    }));
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
      createMutation.mutate({
        inspection_id: inspectionId,
        x_position: position.x,
        y_position: position.y,
        ...formData
      });
    }
  };

  const handleDelete = () => {
    if (existingPoint && confirm('Are you sure you want to delete this inspection point?')) {
      deleteMutation.mutate(existingPoint.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label>Photos</Label>
            <div className="mt-2 space-y-3">
              {formData.photo_urls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {formData.photo_urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
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