import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera, FileText } from 'lucide-react';

const reasonCategories = [
  { value: 'tillsyn', label: 'Tillsyn' },
  { value: 'besiktning', label: 'Besiktning' },
  { value: 'ny_kundbesiktning', label: 'Ny Kundbesiktning' },
  { value: 'anbud_kalkylering', label: 'Anbud/kalkylering' },
  { value: 'egenkontroll', label: 'Egenkontroll' },
  { value: 'other', label: 'Annan (ange nedan)' },
];

const severityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

export default function InspectionSidebar({ points, inspection, onPointClick, onNotesUpdate, onReasonUpdate }) {
  const [notes, setNotes] = useState(inspection?.notes || '');
  const [reasonCategory, setReasonCategory] = useState(inspection?.reason_category || '');
  const [reasonCustom, setReasonCustom] = useState(inspection?.reason_custom || '');
  const [saving, setSaving] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    await onNotesUpdate(notes);
    setSaving(false);
  };

  const handleReasonChange = (val) => {
    setReasonCategory(val);
    onReasonUpdate({ reason_category: val, reason_custom: reasonCustom });
  };

  const handleReasonCustomChange = (val) => {
    setReasonCustom(val);
    onReasonUpdate({ reason_category: reasonCategory, reason_custom: val });
  };

  return (
    <div className="w-80 bg-white border-l overflow-y-auto flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div>
          <Label className="text-sm font-semibold text-gray-900 mb-1 block">Anledning</Label>
          <Select value={reasonCategory} onValueChange={handleReasonChange}>
            <SelectTrigger>
              <SelectValue placeholder="Välj anledning..." />
            </SelectTrigger>
            <SelectContent>
              {reasonCategories.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {reasonCategory === 'other' && (
            <Input
              className="mt-2"
              value={reasonCustom}
              onChange={e => handleReasonCustomChange(e.target.value)}
              placeholder="Ange anledning..."
            />
          )}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">Inspektionsanteckningar</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lägg till allmänna anteckningar om inspektionen..."
            rows={4}
            className="mb-2"
          />
          <Button
            size="sm"
            onClick={handleSaveNotes}
            disabled={saving || notes === (inspection?.notes || '')}
            className="w-full"
          >
            {saving ? 'Sparar...' : 'Spara anteckningar'}
          </Button>
        </div>
      </div>

      <div className="p-4 flex-1">
        <h2 className="font-semibold text-gray-900 mb-3">
          Inspektionspunkter ({points.length})
        </h2>
        
        {points.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">Inga punkter markerade ännu</p>
            <p className="text-xs mt-1">Klicka på kartan för att lägga till inspektionspunkter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {points.map((point, index) => (
              <Card
                key={point.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onPointClick(point)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={`text-xs ${severityColors[point.severity || 'medium']} border`}>
                          {point.severity || 'medium'}
                        </Badge>
                        <span className="text-xs text-gray-600 capitalize">
                          {point.issue_type?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {point.notes && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                          {point.notes}
                        </p>
                      )}
                      {point.photo_details && point.photo_details.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Camera className="w-3 h-3" />
                          {point.photo_details.length} photo{point.photo_details.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}