
/**
 * Build system prompt based on request body constraints
 */
function buildSystemPrompt(requestBody) {
  const constraints = [];
  
  // Core constraints
  if (requestBody.budget) {
    constraints.push(`budget (₹${requestBody.budget} for ${requestBody.numberOfPeople} people)`);
  }
  if (requestBody.minimumRating) {
    constraints.push(`minimum rating (${requestBody.minimumRating}+)`);
  }
  
  // Travel and timing constraints
  if (requestBody.travelTolerance) {
    constraints.push(`travel time limit (max ${requestBody.travelTolerance} min per leg, check distanceKm and travelTimeMinutes)`);
  }
  if (requestBody.timeGapBetweenThings) {
    constraints.push(`preferred gap between activities (${requestBody.timeGapBetweenThings} min)`);
  }
  
  // Experience constraints
  if (requestBody.crowdTolerance) {
    constraints.push(`crowd tolerance (${requestBody.crowdTolerance})`);
  }
  if (requestBody.parkingAccessible) {
    constraints.push('parking required');
  }
  
  // User preferences and tags
  if (requestBody.extraInfo) {
    constraints.push(`user preferences: "${requestBody.extraInfo}" (match with tags field)`);
  }
  
  // Type-specific filters
  if (requestBody.dining) {
    const filters = [];
    if (requestBody.dining.type?.length) filters.push(`type: ${requestBody.dining.type.join(',')}`);
    if (requestBody.dining.cuisines?.length) filters.push(`cuisines: ${requestBody.dining.cuisines.join(',')}`);
    if (requestBody.dining.alcohol !== undefined) filters.push(`alcohol: ${requestBody.dining.alcohol}`);
    if (filters.length) constraints.push(`dining (${filters.join('; ')})`);
  }
  
  if (requestBody.event) {
    const filters = [];
    if (requestBody.event.type?.length) filters.push(`type: ${requestBody.event.type.join(',')}`);
    if (requestBody.event.venue?.length) filters.push(`venue: ${requestBody.event.venue.join(',')}`);
    if (filters.length) constraints.push(`event (${filters.join('; ')})`);
  }
  
  if (requestBody.activity) {
    const filters = [];
    if (requestBody.activity.type?.length) filters.push(`type: ${requestBody.activity.type.join(',')}`);
    if (requestBody.activity.venue?.length) filters.push(`venue: ${requestBody.activity.venue.join(',')}`);
    if (filters.length) constraints.push(`activity (${filters.join('; ')})`);
  }
  
  if (requestBody.play) {
    const filters = [];
    if (requestBody.play.type?.length) filters.push(`type: ${requestBody.play.type.join(',')}`);
    if (requestBody.play.venue?.length) filters.push(`venue: ${requestBody.play.venue.join(',')}`);
    if (requestBody.play.intensity?.length) filters.push(`intensity: ${requestBody.play.intensity.join(',')}`);
    if (filters.length) constraints.push(`play (${filters.join('; ')})`);
  }
  
  if (requestBody.movie) {
    const filters = [];
    if (requestBody.movie.genre?.length) filters.push(`genre: ${requestBody.movie.genre.join(',')}`);
    if (requestBody.movie.language?.length) filters.push(`language: ${requestBody.movie.language.join(',')}`);
    if (requestBody.movie.format?.length) filters.push(`format: ${requestBody.movie.format.join(',')}`);
    if (requestBody.movie.cast?.length) filters.push(`cast: ${requestBody.movie.cast.join(',')}`);
    if (filters.length) constraints.push(`movie (${filters.join('; ')})`);
  }
  
  const constraintsText = constraints.length > 0
    ? `Evaluate based on: ${constraints.join(', ')}.`
    : 'Evaluate all aspects.';
  
  return `You are a scoring engine. ${constraintsText} Note: Each item has distanceKm and travelTimeMinutes from previous location. Return ONLY a single integer between 0 and 100. No explanation. No text.`;
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
        model: 'openai/gpt-oss-120b',
        temperature: 0,
        top_p: 1,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `User Request:\n\`\`\`json\n${JSON.stringify(requestBody, null, 2)}\n\`\`\`\n\nPermutation:\n\`\`\`json\n${JSON.stringify(itinerary, null, 2)}\n\`\`\`\n\nScore this plan.`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, response.statusText);
      return 50;
    }

    const data = await response.json();
    const scoreText = data.choices[0]?.message?.content?.trim();
    const score = parseInt(scoreText, 10);

    if (isNaN(score) || score < 0 || score > 100) {
      console.error('Invalid score from AI:', scoreText);
      return 50;
    }

    console.log('AI Score:', score);
    return score;

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
