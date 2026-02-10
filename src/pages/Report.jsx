import React, { useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReportContent from '../components/report/ReportContent';

export default function Report() {
  const urlParams = new URLSearchParams(window.location.search);
  const inspectionId = urlParams.get('id');
  const reportRef = useRef(null);

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

  if (inspectionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!inspection || !site) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Report not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link to={createPageUrl(`Site?id=${site.id}`)}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Site
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
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