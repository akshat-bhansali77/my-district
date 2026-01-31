
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getRouteGeometry } from '@/app/lib/openroute';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

export default function RouteMap({ locations, apiKey, planNumber, totalPlans, score, goOutsCount, budget, totalDistance, totalTime, activityCount = 1, numPeople = 1, hasEndLocation = false, transportMode = 'driving-car', startTime, endTime, totalTravelMinutes, date }) {
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsClient(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      
      // Fix for default marker icons in Next.js
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    });
  }, []);

  // Fetch route geometry using getRouteGeometry from openroute.js
  useEffect(() => {
    if (!locations || !Array.isArray(locations) || locations.length < 2 || !apiKey) {
      console.log('Missing required params:', {
        locations: locations?.length || 0,
        apiKey: apiKey ? 'present' : 'missing'
      });
      return;
    }

    const fetchRoute = async () => {
      try {
        setLoading(true);
        console.log('Fetching route for locations:', locations);
        const result = await getRouteGeometry(locations, apiKey, transportMode);
        
        console.log('Route result:', result);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        setRouteData(result.route);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching route:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [locations, apiKey, transportMode]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
        <p className="text-gray-600">Loading route...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-red-100 flex items-center justify-center rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!routeData || !routeData.features || routeData.features.length === 0) {
    return (
      <div className="w-full h-full bg-yellow-100 flex items-center justify-center rounded-lg">
        <p className="text-yellow-800">No route data available</p>
      </div>
    );
  }

  // Extract route coordinates (convert from [lng, lat] to [lat, lng])
  const coordinates = routeData.features[0].geometry.coordinates;
  const routePath = coordinates.map(coord => [coord[1], coord[0]]);
  
  // Calculate center for map using all coordinates
  const avgLat = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
  const avgLng = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  
  // Get summary data
  const summary = routeData.features[0].properties.summary;
  const distanceKm = (summary.distance / 1000).toFixed(1);
  const durationMin = (summary.duration / 60).toFixed(0);

  // Custom icons for different waypoints
  const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const startIcon = createIcon('green');
  const endIcon = createIcon('red');
  const waypointIcon = createIcon('blue');

  return (
    <div className="w-full h-full rounded-lg overflow-hidden shadow-lg relative">
      <MapContainer
        center={[avgLat, avgLng]}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route path */}
        <Polyline
          positions={routePath}
          color="blue"
          weight={5}
          opacity={0.7}
        />
        
        {/* Render all location markers */}
        {locations.map((loc, index) => {
          const isStart = index === 0;
          // Only mark as end if hasEndLocation is true AND this is the last location
          const isEnd = hasEndLocation && index === locations.length - 1;
          // Skip rendering marker if this is a "Return to Start" location (route completion)
          const isReturnToStart = loc.name === "🏠 Return to Start";
          
          if (isReturnToStart) {
            return null; // Don't render a marker, but location is used for route calculation
          }
          
          const icon = isStart ? startIcon : (isEnd ? endIcon : waypointIcon);
          const defaultLabel = isStart ? 'Start' : (isEnd ? 'End' : `Stop ${index}`);
          const label = loc.name || defaultLabel;
          const color = isStart ? 'green' : (isEnd ? 'red' : 'blue');
          
          return (
            <Marker
              key={index}
              position={[loc.lat, loc.lng]}
              icon={icon}
            >
              {/* Permanent label on map */}
              <Tooltip
                permanent
                direction="top"
                offset={[0, -40]}
                className="custom-tooltip"
              >
                <div className="font-semibold text-sm">
                  {label}
                </div>
              </Tooltip>
              
              {/* Detailed popup on click */}
              <Popup>
                <div className="text-sm">
                  <strong className={`text-${color}-600`}>{label}</strong>
                  {loc.name && (
                    <>
                      <br />
                      <span className="text-xs text-gray-500">
                        {defaultLabel}
                      </span>
                    </>
                  )}
                  <br />
                  <span className="text-xs">
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </span>
                  {isStart && (
                    <>
                      <br />
                      <strong>Total Distance:</strong> {distanceKm} km
                      <br />
                      <strong>Total Duration:</strong> {durationMin} min
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Plan Info Box - Bottom Left */}
      {planNumber !== undefined && (
        <div className="absolute bottom-4 left-4 bg-gray-900 rounded-lg shadow-lg p-3 z-[1000] border-2 border-purple-500 min-h-[85px] min-w-[200px]">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="text-sm font-semibold text-white">
              Plan {planNumber} of {totalPlans}
            </div>
            {budget !== undefined && (
              <div className="flex items-center gap-1">
                <span className="text-purple-400">₹</span>
                <span className="font-semibold text-purple-400">{budget * numPeople}</span>
              </div>
            )}
          </div>
          <div className="space-y-1 text-xs text-gray-300">
            {goOutsCount !== undefined && (
              <div className="text-purple-400">{goOutsCount} go-outs planned</div>
            )}
            <div className="flex items-center gap-3">
              {totalTime && (
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span className="font-semibold">{totalTime}</span>
                </div>
              )}
            </div>
            {startTime !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-purple-400">🕐</span>
                <span className="font-semibold text-gray-200">
                  {(() => {
                    const formatTime = (time) => {
                      const hours = Math.floor(time);
                      const minutes = Math.round((time - hours) * 60);
                      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    };
                    const start = formatTime(startTime);
                    const end = endTime ? formatTime(endTime) : '';
                    return end ? `${start} - ${end}` : start;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Distance and Time Summary Box - Bottom Right */}
      <div className="absolute bottom-4 right-4 bg-gray-900 rounded-lg shadow-lg p-3 z-[1000] border-2 border-purple-500 min-h-[100px]">
        <div className="text-sm font-semibold text-white mb-2">Travel Summary</div>
        <div className="space-y-1">
          {date && (
            <div className="flex items-center gap-1 text-xs mb-1">
              <span className="text-purple-400">📅</span>
              <span className="font-semibold text-purple-400">
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-purple-400">📏</span>
              <span className="font-semibold text-gray-200">{distanceKm} km</span>
            </div>
            {totalTravelMinutes !== undefined && (
              <>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <span className="text-purple-400">⏱️</span>
                  <span className="font-semibold text-gray-200">{Math.round(totalTravelMinutes)} min</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
