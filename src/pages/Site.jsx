import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, MapPin, FileText, Calendar, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';

export default function Site() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.list();
      return sites.find(s => s.id === siteId);
    },
    enabled: !!siteId
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

  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['inspections', siteId],
    queryFn: () => base44.entities.Inspection.filter({ site_id: siteId }, '-inspection_date'),
    enabled: !!siteId
  });

  const createInspectionMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Inspection.create({
        site_id: siteId,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_name: user.full_name || user.email,
        status: 'in_progress'
      });
    },
    onSuccess: (newInspection) => {
      queryClient.invalidateQueries({ queryKey: ['inspections', siteId] });
      navigate(createPageUrl(`Inspection?id=${newInspection.id}`));
    }
  });

  if (siteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Site not found</h2>
          <Link to={createPageUrl('Home')}>
            <Button className="mt-4">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            {site.map_image_url ? (
              <div className="h-96 overflow-hidden rounded-t-lg bg-gray-100">
                <img
                  src={site.map_image_url}
                  alt={site.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="h-96 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center rounded-t-lg">
                <MapPin className="w-24 h-24 text-green-600 opacity-50" />
              </div>
            )}
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{site.name}</h1>
              {customer && (
                <div className="mb-3 pb-3 border-b">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="text-lg font-semibold text-gray-800">{customer.name}</p>
                  {customer.project_number && (
                    <p className="text-sm text-gray-600">Project: {customer.project_number}</p>
                  )}
                </div>
              )}
              {site.location && (
                <p className="text-gray-600 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  {site.location}
                </p>
              )}
              {site.description && (
                <p className="text-gray-700 mt-4">{site.description}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => createInspectionMutation.mutate()}
                disabled={createInspectionMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Start New Inspection
              </Button>
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Statistics</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Inspections</span>
                    <span className="font-semibold">{inspections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold">
                      {inspections.filter(i => i.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">In Progress</span>
                    <span className="font-semibold">
                      {inspections.filter(i => i.status === 'in_progress').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Inspection History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inspectionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : inspections.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No inspections yet</h3>
                <p className="text-gray-600 mb-6">Start your first inspection to track findings</p>
                <Button
                  onClick={() => createInspectionMutation.mutate()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Start First Inspection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map(inspection => (
                  <Link
                    key={inspection.id}
                    to={createPageUrl(
                      inspection.status === 'completed'
                        ? `Report?id=${inspection.id}`
                        : `Inspection?id=${inspection.id}`
                    )}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge
                                variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                                className={
                                  inspection.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {inspection.status === 'completed' ? 'Completed' : 'In Progress'}
                              </Badge>
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(inspection.inspection_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              {inspection.inspector_name}
                            </div>
                            {inspection.notes && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                                {inspection.notes}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            {inspection.status === 'completed' ? 'View Report' : 'Continue'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}