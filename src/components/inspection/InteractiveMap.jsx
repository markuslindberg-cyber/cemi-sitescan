import React, { useRef, useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

const severityColors = {
  low: 'bg-blue-500 border-blue-600',
  medium: 'bg-yellow-500 border-yellow-600',
  high: 'bg-orange-500 border-orange-600',
  critical: 'bg-red-500 border-red-600'
};

export default function InteractiveMap({ imageUrl, points, onMapClick, onPointClick }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleClick = (e) => {
    if (e.target.tagName === 'IMG' || e.target === containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onMapClick(x, y);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-auto cursor-crosshair bg-gray-100"
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt="Site map"
        className="w-full h-full object-contain"
        draggable={false}
      />
      
      {points.map((point, index) => (
        <button
          key={point.id}
          className={`absolute transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform cursor-pointer z-10`}
          style={{
            left: `${point.x_position}%`,
            top: `${point.y_position}%`
          }}
          onClick={(e) => {
            e.stopPropagation();
            onPointClick(point);
          }}
        >
          <div className="relative group">
            <div className={`w-8 h-8 rounded-full ${severityColors[point.severity || 'medium']} border-2 flex items-center justify-center shadow-lg`}>
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {point.issue_type?.replace(/_/g, ' ')} - {point.severity}
              {point.notes && (
                <div className="mt-1 max-w-xs truncate">{point.notes}</div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}