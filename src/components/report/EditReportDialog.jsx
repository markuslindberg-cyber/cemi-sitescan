import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const reasonCategories = [
  { value: 'tillsyn', label: 'Tillsyn' },
  { value: 'besiktning', label: 'Besiktning' },
  { value: 'ny_kundbesiktning', label: 'Ny Kundbesiktning' },
  { value: 'anbud_kalkylering', label: 'Anbud/kalkylering' },
  { value: 'egenkontroll', label: 'Egenkontroll' },
  { value: 'other', label: 'Annan (ange nedan)' },
];
import { toast } from 'sonner';

const issueTypeLabels = {
  improvement_suggestions: 'Förbättringsförslag',
  issue_damage: 'Problem/Skada',
  plant_health: 'Växthälsa',
  maintenance: 'Underhåll',
  safety_concern: 'Säkerhetsrisk',
  deviation: 'Avvikelse'
};

const severityLabels = {
  low: 'Låg',
  medium: 'Medel',
  high: 'Hög',
  critical: 'Kritisk'
};

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export default function EditReportDialog({ open, onOpenChange, inspection, points }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    report_title: '',
    inspection_date: '',
    inspector_name: '',
    notes: ''
  });
  const [pointsData, setPointsData] = useState([]);
  const [expandedPoint, setExpandedPoint] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (inspection) {
      setFormData({
        report_title: inspection.report_title || '',
        inspection_date: inspection.inspection_date || '',
        inspector_name: inspection.inspector_name || '',
        notes: inspection.notes || '',
        reason_category: inspection.reason_category || '',
        reason_custom: inspection.reason_custom || ''
      });
    }
    if (points) {
      setPointsData(points.map(p => ({ ...p })));
    }
  }, [inspection, points, open]);

  const handleSave = async () => {
    setSaving(true);
    // Update inspection
    await base44.entities.Inspection.update(inspection.id, formData);
    // Update each point that changed
    await Promise.all(
      pointsData.map(p =>
        base44.entities.InspectionPoint.update(p.id, {
          issue_type: p.issue_type,
          severity: p.severity,
          notes: p.notes
        })
      )
    );
    queryClient.invalidateQueries({ queryKey: ['inspection', inspection.id] });
    queryClient.invalidateQueries({ queryKey: ['inspection-points', inspection.id] });
    toast.success('Rapporten har sparats');
    setSaving(false);
    onOpenChange(false);
  };

  const updatePoint = (id, field, value) => {
    setPointsData(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePoint = async (id) => {
    if (!confirm('Är du säker på att du vill radera denna inspektionspunkt?')) return;
    await base44.entities.InspectionPoint.delete(id);
    setPointsData(prev => prev.filter(p => p.id !== id));
    queryClient.invalidateQueries({ queryKey: ['inspection-points', inspection.id] });
    toast.success('Inspektionspunkt raderad');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redigera rapport</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Inspection metadata */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Rapportinformation</h3>
            <div>
              <Label>Rapporttitel</Label>
              <Input
                value={formData.report_title}
                onChange={e => setFormData(p => ({ ...p, report_title: e.target.value }))}
                placeholder="Ange rapporttitel"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={formData.inspection_date}
                  onChange={e => setFormData(p => ({ ...p, inspection_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Besiktningsman</Label>
                <Input
                  value={formData.inspector_name}
                  onChange={e => setFormData(p => ({ ...p, inspector_name: e.target.value }))}
                  placeholder="Namn"
                />
              </div>
            </div>
            <div>
              <Label>Allmänna anteckningar</Label>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                placeholder="Allmänna anteckningar om inspektionen..."
                rows={3}
              />
            </div>
          </div>

          {/* Inspection points */}
          {pointsData.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Inspektionspunkter ({pointsData.length})
              </h3>
              <div className="space-y-2">
                {pointsData.map((point, index) => (
                  <div key={point.id} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      onClick={() => setExpandedPoint(expandedPoint === point.id ? null : point.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {issueTypeLabels[point.issue_type] || point.issue_type}
                        </span>
                        <Badge className={`text-xs ${severityColors[point.severity || 'medium']}`}>
                          {severityLabels[point.severity || 'medium']}
                        </Badge>
                      </div>
                      {expandedPoint === point.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {expandedPoint === point.id && (
                      <div className="px-4 py-3 space-y-3 border-t">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Ärendetyp</Label>
                            <Select
                              value={point.issue_type}
                              onValueChange={val => updatePoint(point.id, 'issue_type', val)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(issueTypeLabels).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Allvarlighetsgrad</Label>
                            <Select
                              value={point.severity || 'medium'}
                              onValueChange={val => updatePoint(point.id, 'severity', val)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(severityLabels).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Anteckningar</Label>
                          <Textarea
                            value={point.notes || ''}
                            onChange={e => updatePoint(point.id, 'notes', e.target.value)}
                            placeholder="Beskriv problemet..."
                            rows={3}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePoint(point.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Radera punkt
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sparar...</> : 'Spara ändringar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}