import React, { useRef, useState, useEffect } from 'react';
import { MapPin, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const severityColors = {
  low: 'bg-blue-500 border-blue-600',
  medium: 'bg-yellow-500 border-yellow-600',
  high: 'bg-orange-500 border-orange-600',
  critical: 'bg-red-500 border-red-600'
};

export default function InteractiveMap({ imageUrl, points, onMapClick, onPointClick }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const imgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

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

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(1, Math.min(5, prev + delta)));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(5, prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(1, prev - 0.25));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1 && e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleClick = (e) => {
    if (isPanning) return;
    if (e.target.tagName === 'IMG') {
      const rect = e.target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onMapClick(x, y);
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-100">
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-white shadow-md"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-white shadow-md"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleResetZoom}
          className="bg-white shadow-md"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
        <div className="bg-white shadow-md rounded px-2 py-1 text-xs font-medium text-center">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden"
        style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'crosshair' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={imageRef}
          className="relative w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: 'center',
            transition: isPanning ? 'none' : 'transform 0.1s ease-out'
          }}
          onClick={handleClick}
        >
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Site map"
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {points.map((point, index) => {
            const markerSize = Math.max(6, 8 * zoom);
            const fontSize = Math.max(8, 12 * zoom);

            return (
            <button
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-full hover:scale-125 transition-transform cursor-pointer z-10"
              style={{
                left: `${point.x_position}%`,
                top: `${point.y_position}%`
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isPanning) {
                  onPointClick(point);
                }
              }}
            >
              <div className="relative group">
                <div 
                  className={`rounded-full ${severityColors[point.severity || 'medium']} border-2 flex items-center justify-center shadow-lg transition-all`}
                  style={{
                    width: `${markerSize}px`,
                    height: `${markerSize}px`
                  }}
                >
                  <span className="text-white font-bold" style={{ fontSize: `${fontSize}px` }}>
                    {index + 1}
                  </span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {point.issue_type?.replace(/_/g, ' ')} - {point.severity}
                  {point.notes && (
                    <div className="mt-1 max-w-xs truncate">{point.notes}</div>
                  )}
                </div>
              </div>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}