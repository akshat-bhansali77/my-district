
import RouteMap from '@/app/components/RouteMap';

export default function MapDemo() {
  // Example with multiple waypoints on valid roads with custom names
  const locations = [
    { lng: 77.2090, lat: 28.6139, name: "India Gate 🏛️" },
    { lng: 77.2500, lat: 28.5950, name: "Lajpat Nagar Market 🛍️" },
    { lng: 77.3100, lat: 28.5700, name: "Nehru Place Metro 🚇" },
    { lng: 77.3910, lat: 28.5355, name: "Noida Sector 18 Mall 🏢" }
  ];
  
  // Hardcoded API key for testing
  const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZjMDM0Yjc3M2QxZDQ1MzVhMzUzMjhmMzcwYWUyZmEzIiwiaCI6Im11cm11cjY0In0=";
  
  console.log('MapDemo - API Key:', apiKey ? 'Present' : 'Missing');
  console.log('MapDemo - Locations:', locations);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Route Map Demo (Multi-Stop)</h1>
      
      <div className="mb-4">
        <p className="text-gray-700 font-semibold mb-2">Route Stops:</p>
        {locations.map((loc, idx) => (
          <p key={idx} className="text-gray-700 ml-4">
            <strong>{idx === 0 ? '🟢' : idx === locations.length - 1 ? '🔴' : '🔵'}</strong> {loc.name || `Location ${idx + 1}`}
            <span className="text-sm text-gray-500 ml-2">({loc.lat.toFixed(4)}, {loc.lng.toFixed(4)})</span>
          </p>
        ))}
      </div>

      <RouteMap
        locations={locations}
        apiKey={apiKey}
        planNumber={undefined}
        totalPlans={undefined}
        score={undefined}
        goOutsCount={undefined}
        budget={undefined}
        totalDistance={undefined}
        totalTime={undefined}
      />
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Features:</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>🗺️ Interactive OpenStreetMap</li>
          <li>📍 Green marker for start, blue for waypoints, red for destination</li>
          <li>🛣️ Blue route path with turn-by-turn directions</li>
          <li>📊 Distance and duration displayed in popup</li>
          <li>🔄 Auto-zoom to fit the entire route</li>
          <li>🚏 Support for multiple waypoints</li>
        </ul>
      </div>
    </div>
  );
}
