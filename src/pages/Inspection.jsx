import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, CheckCircle, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import InteractiveMap from '../components/inspection/InteractiveMap';
import GoogleMapInteractive from '../components/inspection/GoogleMapInteractive';
import InspectionPointDialog from '../components/inspection/InspectionPointDialog';
import InspectionSidebar from '../components/inspection/InspectionSidebar';

export default function Inspection() {
  const urlParams = new URLSearchParams(window.location.search);
  const inspectionId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showPointDialog, setShowPointDialog] = useState(false);
  const [pendingPosition, setPendingPosition] = useState(null);
  const mapRef = useRef(null);

  const { data: inspection, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const inspections = await base44.entities.Inspection.list();
      return inspections.find(i => i.id === inspectionId);
    },
    enabled: !!inspectionId
  });

  const { data: site } = useQuery({
    queryKey: ['site', inspection?.site_id],
    queryFn: async () => {
      const sites = await base44.entities.Site.list();
      return sites.find(s => s.id === inspection.site_id);
    },
    enabled: !!inspection?.site_id
  });

  const { data: points = [] } = useQuery({
    queryKey: ['inspection-points', inspectionId],
    queryFn: () => base44.entities.InspectionPoint.filter({ inspection_id: inspectionId }),
    enabled: !!inspectionId
  });

  const updateInspectionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Inspection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
    }
  });

  const handleMapClick = (xOrLat, yOrLng) => {
    if (site?.map_type === 'google_maps') {
      setPendingPosition({ latitude: xOrLat, longitude: yOrLng });
    } else {
      setPendingPosition({ x: xOrLat, y: yOrLng });
    }
    setSelectedPoint(null);
    setShowPointDialog(true);
  };

  const handlePointClick = (point) => {
    setSelectedPoint(point);
    setPendingPosition(null);
    setShowPointDialog(true);
  };

  const handleCompleteInspection = async () => {
    if (points.length === 0) {
      toast.error('Please add at least one inspection point before completing');
      return;
    }
    
    await updateInspectionMutation.mutateAsync({
      id: inspectionId,
      data: { status: 'completed' }
    });
    
    toast.success('Inspection completed');
    navigate(createPageUrl(`Report?id=${inspectionId}`));
  };

  if (inspectionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading inspection...</p>
        </div>
      </div>
    );
  }

  if (!inspection || !site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inspection not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl(`Site?id=${site.id}`)}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{site.name}</h1>
            <p className="text-sm text-gray-600">
              {new Date(inspection.inspection_date).toLocaleDateString()} • {inspection.inspector_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{points.length} points marked</span>
          <Button
            onClick={handleCompleteInspection}
            disabled={updateInspectionMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Inspection
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative" ref={mapRef}>
          {site.map_type === 'google_maps' && site.google_maps_center ? (
            <GoogleMapInteractive
              center={site.google_maps_center}
              zoom={site.google_maps_zoom || 18}
              points={points}
              onMapClick={handleMapClick}
              onPointClick={handlePointClick}
            />
          ) : site.map_image_url ? (
            <InteractiveMap
              imageUrl={site.map_image_url}
              points={points}
              onMapClick={handleMapClick}
              onPointClick={handlePointClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No map configured for this site</p>
              </div>
            </div>
          )}
        </div>

        <InspectionSidebar
          points={points}
          inspection={inspection}
          onPointClick={handlePointClick}
          onNotesUpdate={(notes) => {
            updateInspectionMutation.mutate({
              id: inspectionId,
              data: { notes }
            });
          }}
        />
      </div>

      <InspectionPointDialog
        open={showPointDialog}
        onOpenChange={setShowPointDialog}
        inspectionId={inspectionId}
        position={pendingPosition}
        existingPoint={selectedPoint}
      />
    </div>
  );
}