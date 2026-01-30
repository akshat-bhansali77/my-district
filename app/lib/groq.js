
/**
 * Build system prompt based on request body constraints
 */
function buildSystemPrompt(requestBody) {
  const constraints = [];
  // Core constraints
  if (requestBody.budget) {
    constraints.push(`budget (₹${requestBody.budget} for ${requestBody.numberOfPeople} people)`);
  }
  
  // Travel and timing constraints
  if (requestBody.travelTolerance && Array.isArray(requestBody.travelTolerance) && requestBody.travelTolerance.length > 0) {
    constraints.push(`travel tolerance: ${requestBody.travelTolerance.join(', ')} (evaluate travel times accordingly)`);
  }
  
  // User preferences
  if (requestBody.extraInfo) {
    constraints.push(`user preferences: "${requestBody.extraInfo}" (consider all venue details)`);
  }
  
  // Extract filters from preferredTypes array (new structure)
  if (requestBody.preferredTypes && Array.isArray(requestBody.preferredTypes)) {
    const typeFiltersMap = {};
    
    requestBody.preferredTypes.forEach((item, index) => {
      const typeName = Object.keys(item)[0];
      const value = item[typeName];
      
      // Only process if it has filters
      if (value.filters && Object.keys(value.filters).length > 0) {
        const filters = value.filters;
        const filtersList = [];
        
        // Type-specific filters
        if (typeName === 'dinings') {
          if (filters.type?.length) filtersList.push(`type: ${filters.type.join(',')}`);
          if (filters.cuisines?.length) filtersList.push(`cuisines: ${filters.cuisines.join(',')}`);
          if (filters.alcohol !== undefined) filtersList.push(`alcohol: ${filters.alcohol}`);
        } else if (typeName === 'events') {
          if (filters.type?.length) filtersList.push(`type: ${filters.type.join(',')}`);
          if (filters.venue?.length) filtersList.push(`venue: ${filters.venue.join(',')}`);
        } else if (typeName === 'activities') {
          if (filters.type?.length) filtersList.push(`type: ${filters.type.join(',')}`);
          if (filters.venue?.length) filtersList.push(`venue: ${filters.venue.join(',')}`);
          if (filters.intensity?.length) filtersList.push(`intensity: ${filters.intensity.join(',')}`);
        } else if (typeName === 'plays') {
          if (filters.type?.length) filtersList.push(`type: ${filters.type.join(',')}`);
          if (filters.venue?.length) filtersList.push(`venue: ${filters.venue.join(',')}`);
          if (filters.intensity?.length) filtersList.push(`intensity: ${filters.intensity.join(',')}`);
          if (filters.cafe !== undefined) filtersList.push(`cafe: ${filters.cafe}`);
        } else if (typeName === 'movies') {
          if (filters.genre?.length) filtersList.push(`genre: ${filters.genre.join(',')}`);
          if (filters.language?.length) filtersList.push(`language: ${filters.language.join(',')}`);
          if (filters.format?.length) filtersList.push(`format: ${filters.format.join(',')}`);
          if (filters.cast?.length) filtersList.push(`cast: ${filters.cast.join(',')}`);
        }
        
        // Common amenity filters
        if (filters.wifi !== undefined) filtersList.push(`wifi: ${filters.wifi}`);
        if (filters.washroom !== undefined) filtersList.push(`washroom: ${filters.washroom}`);
        if (filters.wheelchair !== undefined) filtersList.push(`wheelchair: ${filters.wheelchair}`);
        if (filters.parking !== undefined) filtersList.push(`parking: ${filters.parking}`);
        if (filters.rating !== undefined) filtersList.push(`rating: ${filters.rating}+`);
        if (Array.isArray(filters.crowdTolerance) && filters.crowdTolerance.length > 0) {
          filtersList.push(`crowd tolerance: ${filters.crowdTolerance.join(',')}`);
        }
        
        if (filtersList.length > 0) {
          const typeSingular = typeName.slice(0, -1); // Remove 's'
          constraints.push(`${typeSingular} #${index + 1} (${filtersList.join('; ')})`);
        }
      }
    });
  }
  
  const constraintsText = constraints.length > 0
    ? `Evaluate based on: ${constraints.join(', ')}.`
    : 'Evaluate all aspects.';
  
  return `You are a precise itinerary scoring engine. ${constraintsText}

Analyze the itinerary object and rate it from 0-100 based on the user's intent. For context, distanceKm represents the distance from the previous location, and travelTimeMinutes represents the travel time from the previous location.

Each venue has: name, description, location, pricePerPerson, duration, availableTimeStart, availableTimeEnd, distanceKm, travelTimeMinutes, and amenities (wifi, washroom, wheelchair, parking, rating). Type-specific fields: dinings (type, cuisines, alcohol), movies (genre, language, format, cast), events (type, venue), activities (type, venue, intensity), plays (type, venue, intensity, cafe). Consider all venue details and type-specific fields for scoring. Provide detailed reasoning for the score.

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "score": <integer 0-100>,
  "reasoning": "<detailed explanation with specific constraint analysis and weight distribution>"
}`;
}

/**
 * Score an itinerary using Groq AI
 */
export async function scoreItinerary(itinerary, requestBody) {
  try {
    const systemPrompt = buildSystemPrompt(requestBody);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL,
        temperature: 0,
        top_p: 1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Itinerary:\n\`\`\`json\n${JSON.stringify(itinerary, null, 2)}\n\`\`\`\n\nScore this plan.`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return 50;
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content?.trim();
    
    try {
      // Parse JSON response
      const result = JSON.parse(responseText);
      const score = parseInt(result.score, 10);
      const reasoning = result.reasoning || 'No reasoning provided';

      if (isNaN(score) || score < 0 || score > 100) {
        console.error('Invalid score from AI:', score);
        return 50;
      }

      // Log the reasoning
      console.log('AI Score:', score);
      console.log('AI Reasoning:', reasoning);
      
      return score;
      
    } catch (parseError) {
      // Fallback: try to extract score as plain integer if JSON parsing fails
      console.warn('Failed to parse JSON response, trying plain integer extraction:', parseError.message);
      const score = parseInt(responseText, 10);
      
      if (isNaN(score) || score < 0 || score > 100) {
        console.error('Invalid score from AI:', responseText);
        return 50;
      }
      
      console.log('AI Score (fallback):', score);
      return score;
    }

  } catch (error) {
    console.error('Error scoring itinerary:', error);
    return 50;
  }
}

/**
 * Score multiple itineraries in parallel (with rate limiting)
 */
export async function scoreItineraries(itineraries, requestBody, batchSize = 5) {
  const results = [];
  
  for (let i = 0; i < itineraries.length; i += batchSize) {
    const batch = itineraries.slice(i, i + batchSize);
    const batchPromises = batch.map(itinerary => 
      scoreItinerary(itinerary, requestBody)
    );
    
    const scores = await Promise.all(batchPromises);
    
    batch.forEach((itinerary, idx) => {
      results.push({
        itinerary,
        score: scores[idx]
      });
    });
  }
  
  return results.sort((a, b) => b.score - a.score);
}
