import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin, Calendar, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreateSiteDialog from '../components/sites/CreateSiteDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

export default function Home() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list('-updated_date')
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['all-inspections'],
    queryFn: () => base44.entities.Inspection.list('-inspection_date')
  });

  const getInspectionCount = (siteId) => {
    return inspections.filter(i => i.site_id === siteId).length;
  };

  const getLastInspectionDate = (siteId) => {
    const siteInspections = inspections.filter(i => i.site_id === siteId);
    if (siteInspections.length === 0) return null;
    return siteInspections[0].inspection_date;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Garden Inspections</h1>
            <p className="text-gray-600 mt-2">Manage your outdoor sites and inspections</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowQRCode(true)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <QrCode className="w-5 h-5 mr-2" />
              QR Code
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Site
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg" />
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sites.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No sites yet</h3>
            <p className="text-gray-600 mb-6">Create your first site to start conducting inspections</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-5 h-5 mr-2" />
              Create First Site
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map(site => (
              <Link key={site.id} to={createPageUrl(`Site?id=${site.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {site.map_image_url ? (
                    <div className="h-48 overflow-hidden rounded-t-lg bg-gray-100">
                      <img
                        src={site.map_image_url}
                        alt={site.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center rounded-t-lg">
                      <MapPin className="w-16 h-16 text-green-600 opacity-50" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{site.name}</h3>
                    {site.location && (
                      <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {site.location}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                      <span>{getInspectionCount(site.id)} inspections</span>
                      {getLastInspectionDate(site.id) && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(getLastInspectionDate(site.id)).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <CreateSiteDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />

        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeSVG 
                value={window.location.href} 
                size={256}
                level="H"
                includeMargin={true}
              />
              <p className="text-sm text-gray-600 text-center">
                Scan this code with your phone to access the app
              </p>
              <p className="text-xs text-gray-500 text-center break-all px-4">
                {window.location.href}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}