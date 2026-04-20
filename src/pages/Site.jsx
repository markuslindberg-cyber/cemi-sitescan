import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, MapPin, FileText, Calendar, User, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import EditSiteDialog from '../components/sites/EditSiteDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function Site() {
  const [showEditDialog, setShowEditDialog] = useState(false);
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

  const [currentUser, setCurrentUser] = React.useState(null);
  React.useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data?.users || [];
    }
  });

  const getManagerName = (managerId) => {
    const user = users.find(u => u.id === managerId);
    if (!user) return '';
    return user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.full_name || user.email;
  };

  const addToTrash = async (entityType, entityId, displayName, data) => {
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const user = await base44.auth.me();
    await base44.entities.Trash.create({
      entity_type: entityType,
      entity_id: entityId,
      display_name: displayName,
      entity_data: data,
      deleted_by: user?.email || '',
      expires_at,
    });
  };

  const deleteInspectionMutation = useMutation({
    mutationFn: async (inspection) => {
      const points = await base44.entities.InspectionPoint.filter({ inspection_id: inspection.id });
      await Promise.all(points.map(p => base44.entities.InspectionPoint.delete(p.id)));
      await addToTrash('Inspection', inspection.id, `${inspection.inspection_number} – ${site?.name || ''}`, inspection);
      return base44.entities.Inspection.delete(inspection.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections', siteId] });
    }
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async () => {
      const siteInspections = await base44.entities.Inspection.filter({ site_id: siteId });
      for (const inspection of siteInspections) {
        const points = await base44.entities.InspectionPoint.filter({ inspection_id: inspection.id });
        await Promise.all(points.map(p => base44.entities.InspectionPoint.delete(p.id)));
        await base44.entities.Inspection.delete(inspection.id);
      }
      await addToTrash('Site', siteId, site.name, site);
      return base44.entities.Site.delete(siteId);
    },
    onSuccess: () => {
      navigate(createPageUrl('Home'));
      queryClient.invalidateQueries({ queryKey: ['sites'] });
    }
  });

  const createInspectionMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const allInspections = await base44.entities.Inspection.list('-created_date');
      const nextNumber = allInspections.length + 1;
      const inspectionNumber = `INS-${String(nextNumber).padStart(4, '0')}`;
      
      return base44.entities.Inspection.create({
        site_id: siteId,
        inspection_number: inspectionNumber,
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
          <h2 className="text-2xl font-bold text-gray-900">Platsen hittades inte</h2>
          <Link to={createPageUrl('Home')}>
            <Button className="mt-4">Tillbaka till startsidan</Button>
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
          Tillbaka till platser
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
              <div className="flex flex-col gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{site.name}</h1>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Redigera
                  </Button>
                  {currentUser?.role === 'admin' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Radera
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Radera platsen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Detta raderar {site.name} och alla dess inspektioner permanent. Åtgärden kan inte ångras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteSiteMutation.mutate();
                            }}
                          >
                            Radera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              {customer && (
                <div className="mb-3 pb-3 border-b">
                  <p className="text-sm text-gray-500">Kund</p>
                  <Link to={createPageUrl(`Customer?id=${customer.id}`)} onClick={e => e.stopPropagation()}>
                    <p className="text-lg font-semibold text-green-700 hover:underline cursor-pointer">{customer.name}</p>
                  </Link>
                  {customer.project_number && (
                    <p className="text-sm text-gray-600">Projekt: {customer.project_number}</p>
                  )}
                </div>
              )}
              {site.location && (
                <p className="text-gray-600 flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  {site.location}
                </p>
              )}
              {site.site_manager && (
                <div className="mt-4 pt-4 border-t flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  <span className="text-sm text-gray-600">Områdesansvarig: </span>
                  <span className="font-semibold">{getManagerName(site.site_manager)}</span>
                </div>
              )}
              {site.description && (
                <p className="text-gray-700 mt-4">{site.description}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snabbåtgärder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => createInspectionMutation.mutate()}
                disabled={createInspectionMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Starta ny inspektion
              </Button>
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Statistik</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Totalt inspektioner</span>
                    <span className="font-semibold">{inspections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Slutförda</span>
                    <span className="font-semibold">
                      {inspections.filter(i => i.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pågående</span>
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
            Inspektionshistorik
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Inga inspektioner ännu</h3>
                <p className="text-gray-600 mb-6">Starta din första inspektion för att dokumentera fynd</p>
                <Button
                  onClick={() => createInspectionMutation.mutate()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Starta första inspektion
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map(inspection => (
                  <Card
                    key={inspection.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(createPageUrl(
                      inspection.status === 'completed'
                        ? `Report?id=${inspection.id}`
                        : `Inspection?id=${inspection.id}`
                    ))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-bold text-gray-900">
                              {inspection.inspection_number}
                            </span>
                            <Badge
                              variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                              className={
                                inspection.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {inspection.status === 'completed' ? 'Slutförd' : 'Pågående'}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(inspection.inspection_date).toLocaleDateString('sv-SE')}
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
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            {inspection.status === 'completed' ? 'Visa rapport' : 'Fortsätt'}
                          </Button>
                          {currentUser?.role === 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Radera inspektion?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Detta tar bort inspektion {inspection.inspection_number} och alla dess punkter permanent. Åtgärden kan inte ångras.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={(e) => { e.stopPropagation(); deleteInspectionMutation.mutate(inspection); }}
                                  >
                                    Radera
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <EditSiteDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          site={site}
        />
      </div>
    </div>
  );
}