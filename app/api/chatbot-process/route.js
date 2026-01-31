
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Helper to geocode location names
async function geocodeLocation(locationName) {
  try {
    // Try geocoding with the original location name
    let response = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZjMDM0Yjc3M2QxZDQ1MzVhMzUzMjhmMzcwYWUyZmEzIiwiaCI6Im11cm11cjY0In0=&text=${encodeURIComponent(locationName)}`
    );
    let data = await response.json();
    
    // If no results and location looks like it might be in India, try adding common city names
    if ((!data.features || data.features.length === 0) && locationName.toLowerCase().includes('sector')) {
      console.log('Trying with "Gurgaon, India" suffix...');
      response = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZjMDM0Yjc3M2QxZDQ1MzVhMzUzMjhmMzcwYWUyZmEzIiwiaCI6Im11cm11cjY0In0=&text=${encodeURIComponent(locationName + ', Gurgaon, India')}`
      );
      data = await response.json();
    }
    
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates;
      return { lat, lng, name: data.features[0].properties.label };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { messages, currentPayload, missingFields } = await request.json();

    // Get the last user message
    const lastUserMessage = messages[messages.length - 1].content;

    // Create a system prompt that guides the AI to extract information
    const systemPrompt = `You are District Assistant, a helpful AI that helps users plan their day out in 2026. Your task is to:

1. Extract relevant information from user messages to build a request payload
2. Ask follow-up questions for missing mandatory fields
3. Be conversational and friendly
4. When users mention locations, recognize them (even informal names)
5. Guide users through the planning process naturally
6. When users mention go-out preferences (dinner, movie, events, etc.), extract and structure them appropriately

Current payload state: ${JSON.stringify(currentPayload, null, 2)}

Missing mandatory fields: ${missingFields.join(', ')}

CRITICAL preferredTypes STRUCTURE:
When users mention go-out types, use this format with "filters" key:
- For dining: Add {"dinings": {"filters": {}}} to preferredTypes
- For movies: Add {"movies": {"filters": {}}} to preferredTypes
- For events: Add {"events": {"filters": {}}} to preferredTypes
- For activities: Add {"activities": {"filters": {}}} to preferredTypes
- For plays: Add {"plays": {"filters": {}}} to preferredTypes

Add specific filters inside the filters object if mentioned:
{"dinings": {"filters": {"cuisines": ["Italian"], "alcohol": true}}}
{"movies": {"filters": {"genre": ["Action"], "language": ["English"]}}}

Example: If user says "dinner and a movie", extractedData should include:
{
  "preferredTypes": [{"dinings": {"filters": {}}}, {"movies": {"filters": {}}}]
}

DATE & TIME CONVERSIONS (Year is 2026):
- "Valentine's Day" = "2026-02-14"
- "5 pm" or "5 PM" = 17 (convert to 24-hour format)
- "6 pm" = 18, "noon" = 12

NUMBER OF PEOPLE INFERENCE:
- "with my girlfriend/boyfriend/partner/spouse" = 2 people
- "with my friend" = 2 people
- "with my family" = ask for clarification
- "alone" or "by myself" = 1 person
- "with friends" (plural) = ask how many

Request payload structure:
- date (YYYY-MM-DD) - MANDATORY. Convert named dates to 2026 dates.
- startTime (24-hour format number, e.g., 17 for 5pm) - MANDATORY
- budget (number) - MANDATORY
- numberOfPeople (number) - MANDATORY
- startLocation (object: {lat, lng}) - MANDATORY. Will be geocoded from location name.
  IMPORTANT: If user provides vague location (e.g., "Sector 57"), ask which city (e.g., "Sector 57 in which city - Gurgaon, Delhi, or another?")
  Then include full location in needsGeocoding: ["Sector 57, Gurgaon, India"]
- preferredTypes (array of objects) - MANDATORY if user mentions go-out types

Optional fields:
- endTime (number: 24-hour)
- endLocation (object: {lat, lng})
- extraInfo (string)
- travelTolerance (array: ["low", "medium", "high"])
- transportMode (string: 'driving-car', 'cycling-electric', 'foot-walking')

Filter fields for each go-out type (wrap in {"filters": {...}}):
- dinings: {type: [], cuisines: [], alcohol: bool, wifi: bool, washroom: bool, wheelchair: bool, parking: bool, rating: number, crowdTolerance: []}
- movies: {genre: [], language: [], format: [], cast: []}
- events: {type: [], venue: []}
- activities: {type: [], venue: [], intensity: []}
- plays: {type: [], venue: [], intensity: [], cafe: bool}

Respond with a JSON object:
{
  "response": "Your conversational response to the user",
  "extractedData": {
    // Any fields you extracted from their message
  },
  "needsGeocoding": ["location string if mentioned"],
  "nextQuestion": "What to ask next if missing fields remain",
  "readyToGenerate": false
}

If all mandatory fields are filled, set readyToGenerate to true.`;

    // Call Groq AI
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10), // Last 10 messages for context
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);
    
    console.log('\n=== AI Response ===');
    console.log('Extracted Data:', JSON.stringify(aiResponse.extractedData, null, 2));
    console.log('Needs Geocoding:', aiResponse.needsGeocoding);
    
    // Update payload with extracted data
    let updatedPayload = { ...currentPayload };
    if (aiResponse.extractedData) {
      updatedPayload = { ...updatedPayload, ...aiResponse.extractedData };
      console.log('Payload after AI extraction:', JSON.stringify(updatedPayload, null, 2));
    }

    // Handle location geocoding if needed
    if (aiResponse.needsGeocoding && aiResponse.needsGeocoding.length > 0) {
      console.log('\n=== Geocoding Locations ===');
      for (const locationStr of aiResponse.needsGeocoding) {
        console.log(`Geocoding: "${locationStr}"`);
        const geocoded = await geocodeLocation(locationStr);
        if (geocoded) {
          console.log(`Geocoded to: lat=${geocoded.lat}, lng=${geocoded.lng}, name="${geocoded.name}"`);
          // Determine if it's start or end location based on context
          if (!updatedPayload.startLocation || !updatedPayload.startLocation.lat) {
            updatedPayload.startLocation = { lat: geocoded.lat, lng: geocoded.lng };
            console.log('Set as START location');
          } else if (lastUserMessage.toLowerCase().includes('end') || lastUserMessage.toLowerCase().includes('return')) {
            updatedPayload.endLocation = { lat: geocoded.lat, lng: geocoded.lng };
            console.log('Set as END location');
          }
        } else {
          console.log('Geocoding failed');
        }
      }
      console.log('Payload after geocoding:', JSON.stringify(updatedPayload, null, 2));
    }

    // Store previous missing fields count
    const previousMissingCount = missingFields.length;
    
    // Calculate which mandatory fields are still missing
    const newMissingFields = [];
    if (!updatedPayload.date) newMissingFields.push('date');
    if (!updatedPayload.startTime && updatedPayload.startTime !== 0) newMissingFields.push('startTime');
    if (!updatedPayload.budget) newMissingFields.push('budget');
    if (!updatedPayload.numberOfPeople) newMissingFields.push('numberOfPeople');
    if (!updatedPayload.startLocation || !updatedPayload.startLocation.lat) newMissingFields.push('startLocation');
    
    console.log('\n=== Missing Fields Check ===');
    console.log('Previous missing count:', previousMissingCount);
    console.log('Current missing fields:', newMissingFields);

    // Build the response
    let responseText = aiResponse.response;
    
    // If there are still missing fields and AI provided next question
    if (newMissingFields.length > 0 && aiResponse.nextQuestion) {
      responseText += '\n\n' + aiResponse.nextQuestion;
    }
    
    // If all mandatory fields are now collected (transition from incomplete to complete)
    if (newMissingFields.length === 0 && previousMissingCount > 0) {
      responseText += '\n\n✨ Perfect! I have all the essential information. Is there anything else you\'d like me to know (dietary restrictions, accessibility needs, specific preferences, or go-out type preferences like cuisines/movie genres)?\n\nYou can also click the "Generate Itinerary" button at the top to proceed right away!';
    }

    console.log('\n=== Final Response ===');
    console.log('Response text:', responseText);
    console.log('Final payload:', JSON.stringify(updatedPayload, null, 2));
    console.log('Ready to generate:', newMissingFields.length === 0);
    console.log('===================\n');

    return Response.json({
      success: true,
      response: responseText,
      payload: updatedPayload,
      missingFields: newMissingFields,
      readyToGenerate: newMissingFields.length === 0
    });

  } catch (error) {
    console.error('Chatbot processing error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
