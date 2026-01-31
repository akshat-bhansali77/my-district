
import { NextResponse } from 'next/server';

/**
 * ORS Autocomplete API
 * User types → Get suggestions → User selects → Return coords
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text');

    if (!text || text.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Query must be at least 2 characters' 
      }, { status: 400 });
    }

    const url = new URL('https://api.openrouteservice.org/geocode/autocomplete');
    url.searchParams.append('text', text);
    url.searchParams.append('size', '5'); // Limit to 5 suggestions
    url.searchParams.append('boundary.country', 'IN'); // Focus on India
    const api_key = process.env.OPENROUTE_API_KEY;
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Authorization': api_key,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('ORS Autocomplete API error:', response.status, response.statusText);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch location suggestions' 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform ORS response to our format
    // Note: ORS returns [lng, lat] so we need to swap
    const suggestions = data.features?.map(feature => ({
      label: feature.properties.label,
      lat: feature.geometry.coordinates[1], // Swap: index 1 is lat
      lng: feature.geometry.coordinates[0], // Swap: index 0 is lng
      name: feature.properties.name || feature.properties.label,
      locality: feature.properties.locality,
      region: feature.properties.region,
      country: feature.properties.country
    })) || [];

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
