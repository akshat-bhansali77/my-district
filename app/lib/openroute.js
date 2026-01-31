
/**
 * Get distance and duration matrix between multiple locations using OpenRouteService Matrix API v2
 * @param {Array<Object>} locations - Array of locations { lng, lat }
 * @param {string} apiKey - OpenRouteService API key
 * @param {Array<number>} sources - Optional array of source indices (defaults to all locations)
 * @param {Array<number>} destinations - Optional array of destination indices (defaults to all locations)
 * @param {string} profile - Transport profile: 'driving-car', 'cycling-electric', 'foot-walking' (defaults to 'driving-car')
 * @returns {Promise<Object>} Matrix with distances and durations
 */
export async function getDistanceMatrix(locations, apiKey, sources = null, destinations = null, profile = 'driving-car') {
  try {
    if (!locations || locations.length < 2) {
      return {
        success: false,
        error: "At least 2 locations are required"
      };
    }

    // Convert locations to the format required by the API: [[lng, lat], [lng, lat], ...]
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);

    const body = {
      locations: coordinates,
      metrics: ["distance", "duration"]
    };

    // Add sources and destinations if specified
    if (sources) {
      body.sources = sources;
    }
    if (destinations) {
      body.destinations = destinations;
    }

    const url = `https://api.openrouteservice.org/v2/matrix/${profile}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouteService API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      distances: data.distances, // 2D array of distances in meters
      durations: data.durations, // 2D array of durations in seconds
      locations: locations,
      metadata: data.metadata
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get distance and duration between two specific locations
 * @param {Object} start - Starting location { lng, lat }
 * @param {Object} end - Ending location { lng, lat }
 * @param {string} apiKey - OpenRouteService API key
 * @param {string} profile - Transport profile: 'driving-car', 'cycling-electric', 'foot-walking' (defaults to 'driving-car')
 * @returns {Promise<Object>} Distance and duration information
 */
export async function getDistance(start, end, apiKey, profile = 'driving-car') {
  const result = await getDistanceMatrix([start, end], apiKey, [0], [1], profile);
  
  if (!result.success) {
    return result;
  }
  
  return {
    success: true,
    distance: result.distances[0][0], // in meters
    duration: result.durations[0][0], // in seconds
    distanceKm: (result.distances[0][0] / 1000).toFixed(2),
    durationMinutes: Math.ceil(result.durations[0][0] / 60)
  };
}

/**
 * Get full route with geometry for map visualization (supports multiple waypoints)
 * @param {Array<Object>} locations - Array of locations [{ lng, lat }, { lng, lat }, ...]
 * @param {string} apiKey - OpenRouteService API key
 * @param {string} profile - Transport profile: 'driving-car', 'cycling-electric', 'foot-walking' (defaults to 'driving-car')
 * @returns {Promise<Object>} Full route GeoJSON with geometry, steps, and summary
 */
export async function getRouteGeometry(locations, apiKey, profile = 'driving-car') {
  try {
    // Convert locations to coordinates array
    const coordinates = locations.map(loc => [loc.lng, loc.lat]);
    
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json, application/geo+json",
        "Authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: coordinates
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouteService API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      route: data
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
