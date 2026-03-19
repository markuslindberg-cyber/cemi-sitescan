import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, MapPin, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';

export default function Inspections() {
  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['all-inspections'],
    queryFn: () => base44.entities.Inspection.list('-inspection_date')
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['all-sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const getSiteLocation = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.location || '';
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Alla inspektioner</h1>
          <p className="text-gray-600 mt-2">Visa alla inspektionsrapporter för alla platser</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : inspections.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No inspections yet</h3>
            <p className="text-gray-600">Start your first inspection from a site page</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {inspections.map(inspection => (
              <Link
                key={inspection.id}
                to={createPageUrl(
                  inspection.status === 'completed'
                    ? `Report?id=${inspection.id}`
                    : `Inspection?id=${inspection.id}`
                )}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
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
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {getSiteName(inspection.site_id)}
                        </h3>
                        {getSiteLocation(inspection.site_id) && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                            <MapPin className="w-4 h-4" />
                            {getSiteLocation(inspection.site_id)}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          {inspection.inspector_name}
                        </div>
                        {inspection.notes && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                            {inspection.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}