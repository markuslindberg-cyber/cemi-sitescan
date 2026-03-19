import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, FileText } from 'lucide-react';

const severityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

export default function InspectionSidebar({ points, inspection, onPointClick, onNotesUpdate }) {
  const [notes, setNotes] = useState(inspection?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    await onNotesUpdate(notes);
    setSaving(false);
  };

  return (
    <div className="w-80 bg-white border-l overflow-y-auto flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900 mb-4">Inspektionsanteckningar</h2>
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

      <div className="p-4 flex-1">
        <h2 className="font-semibold text-gray-900 mb-3">
          Inspection Points ({points.length})
        </h2>
        
        {points.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm">No points marked yet</p>
            <p className="text-xs mt-1">Click on the map to add inspection points</p>
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