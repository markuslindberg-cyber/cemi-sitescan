import React, { useRef, useState, useEffect } from 'react';

const markerColors = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

/**
 * Renders a site map image with inspection point markers positioned correctly,
 * matching the same coordinate system used in InteractiveMap during inspection.
 * 
 * The image is rendered with object-contain inside a fixed-aspect container.
 * Markers are placed as % of the actual rendered image area (not the container).
 */
export default function MapWithMarkers({ imageUrl, points }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgRect, setImgRect] = useState(null);
  const [containerRect, setContainerRect] = useState(null);

  const updateRects = () => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;

    const containerW = container.offsetWidth;
    const containerH = container.offsetHeight;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    if (!naturalW || !naturalH) return;

    // Calculate rendered image size (object-contain logic)
    const containerRatio = containerW / containerH;
    const imageRatio = naturalW / naturalH;

    let renderedW, renderedH;
    if (imageRatio > containerRatio) {
      renderedW = containerW;
      renderedH = containerW / imageRatio;
    } else {
      renderedH = containerH;
      renderedW = containerH * imageRatio;
    }

    // Offset from top-left of container to top-left of rendered image (centered)
    const offsetX = (containerW - renderedW) / 2;
    const offsetY = (containerH - renderedH) / 2;

    setImgRect({ width: renderedW, height: renderedH, offsetX, offsetY });
    setContainerRect({ width: containerW, height: containerH });
  };

  useEffect(() => {
    if (imgRef.current?.complete) {
      updateRects();
    }
    window.addEventListener('resize', updateRects);
    return () => window.removeEventListener('resize', updateRects);
  }, [imageUrl]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gray-50 border border-gray-300 rounded-lg overflow-hidden"
      style={{ aspectRatio: '4/3' }}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Site map"
        className="w-full h-full object-contain"
        onLoad={updateRects}
        draggable={false}
      />

      {imgRect && points.map((point, index) => {
        // Position markers relative to the actual rendered image area
        const left = imgRect.offsetX + (point.x_position / 100) * imgRect.width;
        const top = imgRect.offsetY + (point.y_position / 100) * imgRect.height;

        return (
          <div
            key={point.id}
            className="absolute"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${markerColors[point.severity || 'medium']}`}>
              <span className="text-white text-xs font-bold">{index + 1}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}