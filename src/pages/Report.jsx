import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReportContent from '../components/report/ReportContent';
import EditReportDialog from '../components/report/EditReportDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Report() {
  const urlParams = new URLSearchParams(window.location.search);
  const inspectionId = urlParams.get('id');
  const reportRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [isEditingReport, setIsEditingReport] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: customer } = useQuery({
    queryKey: ['customer', site?.customer_id],
    queryFn: async () => {
      if (!site?.customer_id) return null;
      const customers = await base44.entities.Customer.list();
      return customers.find(c => c.id === site.customer_id);
    },
    enabled: !!site?.customer_id
  });

  const { data: points = [] } = useQuery({
    queryKey: ['inspection-points', inspectionId],
    queryFn: () => base44.entities.InspectionPoint.filter({ inspection_id: inspectionId }),
    enabled: !!inspectionId
  });

  const handlePrint = () => {
    window.print();
  };

  const updateTitleMutation = useMutation({
    mutationFn: (title) => base44.entities.Inspection.update(inspectionId, { report_title: title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      setIsEditingTitle(false);
    }
  });

  const handleEditTitle = () => {
    setReportTitle(inspection?.report_title || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitle = () => {
    updateTitleMutation.mutate(reportTitle);
  };

  if (inspectionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Laddar rapport...</p>
        </div>
      </div>
    );
  }

  if (!inspection || !site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rapporten hittades inte</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Tillbaka till startsidan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden bg-white border-b px-4 py-3 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10">
        <Link to={createPageUrl(`Site?id=${site.id}`)}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Tillbaka till platsen</span>
            <span className="sm:hidden">Tillbaka</span>
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsEditingReport(true)} variant="outline" size="sm">
            <Edit2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Redigera rapport</span>
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Ladda ner PDF</span>
          </Button>
        </div>
      </div>

      <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera rapporttitel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Rapporttitel</Label>
              <Input
                id="title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Ange rapporttitel"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditingTitle(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSaveTitle}>
                Spara
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditReportDialog
        open={isEditingReport}
        onOpenChange={setIsEditingReport}
        inspection={inspection}
        points={points}
      />

      <div className="max-w-5xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none">
        <div ref={reportRef}>
          <ReportContent
            inspection={inspection}
            site={site}
            customer={customer}
            points={points}
          />
        </div>
      </div>
    </div>
  );
}