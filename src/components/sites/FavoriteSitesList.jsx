import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Star, MapPin } from 'lucide-react';

export default function FavoriteSitesList({ favorites, sites }) {
  if (favorites.length === 0) return null;

  const favoriteSites = favorites
    .map(fav => sites.find(s => s.id === fav.site_id))
    .filter(Boolean);

  if (favoriteSites.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
        <h2 className="text-sm font-semibold text-gray-700">Mina favoriter</h2>
      </div>
      <div className="flex flex-col gap-2">
        {favoriteSites.map(site => (
          <Link key={site.id} to={createPageUrl(`Site?id=${site.id}`)}>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all shadow-sm cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                {site.map_image_url ? (
                  <img src={site.map_image_url} alt={site.name} className="w-8 h-8 object-cover rounded-md" />
                ) : (
                  <MapPin className="w-4 h-4 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{site.name}</p>
                {site.location && (
                  <p className="text-xs text-gray-500 truncate">{site.location}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}