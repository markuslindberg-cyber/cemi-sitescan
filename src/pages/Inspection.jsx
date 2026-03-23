import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, CheckCircle, MapPin, List, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  const [showNotesSheet, setShowNotesSheet] = useState(false);
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

  const deleteInspectionMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(points.map(p => base44.entities.InspectionPoint.delete(p.id)));
      await base44.entities.Inspection.delete(inspectionId);
    },
    onSuccess: () => {
      toast.success('Inspektionen raderad');
      navigate(createPageUrl(`Site?id=${site.id}`));
    }
  });

  const handleDeleteInspection = () => {
    if (confirm('Är du säker på att du vill radera denna inspektion? Alla inspektionspunkter kommer också att raderas.')) {
      deleteInspectionMutation.mutate();
    }
  };

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
      toast.error('Lägg till minst en inspektionspunkt innan du slutför');
      return;
    }
    
    await updateInspectionMutation.mutateAsync({
      id: inspectionId,
      data: { status: 'completed' }
    });
    
    toast.success('Inspektionen slutförd');
    navigate(createPageUrl(`Report?id=${inspectionId}`));
  };

  if (inspectionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Laddar inspektion...</p>
        </div>
      </div>
    );
  }

  if (!inspection || !site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inspektionen hittades inte</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Tillbaka till startsidan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: '100dvh' }}>
      <div className="bg-white border-b px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
           <Link to={createPageUrl(`Site?id=${site.id}`)}>
             <Button variant="ghost" size="sm" className="flex-shrink-0">
               <ArrowLeft className="w-4 h-4" />
             </Button>
           </Link>
           <div className="min-w-0 flex-1">
             <div className="flex items-center gap-2 flex-wrap">
               <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">{site.name}</h1>
               <span className="text-xs font-bold px-2 py-1 bg-gray-800 text-white rounded flex-shrink-0">
                 {inspection.inspection_number}
               </span>
             </div>
             <p className="text-xs sm:text-sm text-gray-600 truncate">
               {new Date(inspection.inspection_date).toLocaleDateString('sv-SE')} • {inspection.inspector_name}
             </p>
           </div>
         </div>
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-600">{points.length} punkter</span>
          <Button
            onClick={() => setShowNotesSheet(true)}
            variant="outline"
            size="sm"
            className="sm:hidden"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleDeleteInspection}
            disabled={deleteInspectionMutation.isPending}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm py-1 px-2 sm:px-3"
          >
            <Trash2 className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Radera</span>
          </Button>
          <Button
            onClick={handleCompleteInspection}
            disabled={updateInspectionMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-1 px-2 sm:px-4"
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Slutför</span>
            <span className="sm:hidden">Klar</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
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
                <p className="text-gray-600">Ingen karta konfigurerad för denna plats</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block sm:w-80 border-l bg-white overflow-y-auto">
          <InspectionSidebar
            points={points}
            inspection={inspection}
            onPointClick={handlePointClick}
            onNotesUpdate={(notes) => {
              updateInspectionMutation.mutate({ id: inspectionId, data: { notes } });
            }}
            onReasonUpdate={(reasonData) => {
              updateInspectionMutation.mutate({ id: inspectionId, data: reasonData });
            }}
          />
        </div>
      </div>

      <InspectionPointDialog
        open={showPointDialog}
        onOpenChange={setShowPointDialog}
        inspectionId={inspectionId}
        position={pendingPosition}
        existingPoint={selectedPoint}
      />

      <Sheet open={showNotesSheet} onOpenChange={setShowNotesSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Anteckningar & inspektionspunkter</SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto h-[calc(80vh-100px)]">
            <InspectionSidebar
              points={points}
              inspection={inspection}
              onPointClick={(point) => {
                handlePointClick(point);
                setShowNotesSheet(false);
              }}
              onNotesUpdate={(notes) => {
                updateInspectionMutation.mutate({ id: inspectionId, data: { notes } });
              }}
              onReasonUpdate={(reasonData) => {
                updateInspectionMutation.mutate({ id: inspectionId, data: reasonData });
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}