import React, { useRef, useState } from 'react';

const markerColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

/**
 * Renders a site map image with inspection point markers positioned correctly.
 * Uses a wrapper div that matches the image's natural aspect ratio so the image
 * fills 100% of the container with no letterboxing — markers are placed as % 
 * of container width/height which is identical to the image area.
 * This ensures markers are stable at print time (no px calculations).
 */
export default function MapWithMarkers({ imageUrl, points }) {
  const imgRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  const handleLoad = () => {
    const img = imgRef.current;
    if (img && img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  return (
    <div
      className="relative w-full border border-gray-300 rounded-lg overflow-hidden"
      style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Site map"
        className="absolute inset-0 w-full h-full object-fill"
        onLoad={handleLoad}
        draggable={false}
      />

      {points.map((point, index) => (
        <div
          key={point.id}
          className="absolute"
          style={{
            left: `${point.x_position}%`,
            top: `${point.y_position}%`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${markerColors[point.severity || 'medium']}`}>
            <span className="text-white text-xs font-bold">{index + 1}</span>
          </div>
        </div>
      ))}
    </div>
  );
}