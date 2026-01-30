
import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongo";
import { getDistanceMatrix } from "@/app/lib/openroute";
import { scoreItineraries } from "@/app/lib/groq";
import Dining from "@/app/models/Dining";
import Event from "@/app/models/Event";
import Activity from "@/app/models/Activity";
import Movie from "@/app/models/Movie";
import Play from "@/app/models/Play";

/**
 * Enrich itineraries with travel distance and time, then validate time constraints
 * @param {Array<Object>} itineraries - Array of itinerary objects
 * @param {Object} startLocation - Starting location { lat, lng }
 * @param {number} startTime - Start time in hours
 * @param {string} apiKey - OpenRouteService API key
 * @returns {Promise<Array>>} Valid enriched itineraries
 */
async function enrichItinerariesWithTravel(itineraries, startLocation, startTime, apiKey) {
  if (!itineraries.length) return [];

  // Collect unique locations
  const locationMap = new Map();
  const addLocation = (loc) => {
    const key = `${loc.lat},${loc.lng}`;
    if (!locationMap.has(key)) locationMap.set(key, loc);
  };

  addLocation(startLocation);
  itineraries.forEach(itinerary => {
    itinerary.itinerary.forEach(item => {
      const value = Object.values(item)[0];
      if (value.location) addLocation(value.location);
    });
  });

  const allLocations = Array.from(locationMap.values());
  
  // Single Matrix API call
  const matrixResult = await getDistanceMatrix(allLocations, apiKey);
  if (!matrixResult.success) return [];

  // Build location index
  const locationIndex = new Map();
  allLocations.forEach((loc, idx) => {
    locationIndex.set(`${loc.lat},${loc.lng}`, idx);
  });

  // Enrich and validate time
  const validItineraries = [];

  for (const itinerary of itineraries) {
    let prevIdx = locationIndex.get(`${startLocation.lat},${startLocation.lng}`);
    let currentTime = startTime;
    let isTimeValid = true;

    const enrichedItems = itinerary.itinerary.map(item => {
      const [type, value] = Object.entries(item)[0];
      const currIdx = locationIndex.get(`${value.location.lat},${value.location.lng}`);
      
      const distanceKm = parseFloat((matrixResult.distances[prevIdx][currIdx] / 1000).toFixed(2));
      const travelTimeMinutes = Math.ceil(matrixResult.durations[prevIdx][currIdx] / 60);
      
      // Add travel time
      currentTime += travelTimeMinutes / 60;
      
      // Activity starts now
      const activityStartTime = currentTime;
      const activityDuration = (value.duration || 0) / 60;
      const activityEndTime = activityStartTime + activityDuration;
      
      // Check if activity fits within venue's operating hours
      if (activityStartTime < (value.availableTimeStart || 0) ||
          activityEndTime > (value.availableTimeEnd || 24)) {
        isTimeValid = false;
      }
      
      // Update current time to when activity ends
      currentTime = activityEndTime;
      prevIdx = currIdx;

      return {
        [type]: {
          ...value,
          distanceKm,
          travelTimeMinutes
        }
      };
    });

    // Only include itineraries that meet time constraints
    if (isTimeValid) {
      validItineraries.push(enrichedItems);
    }
  }

  return validItineraries;
}

/**
 * Generate all possible itinerary combinations respecting preferredTypes order
 * @param {Array<Object>} preferredTypes - Array of type objects with specific objects or {}
 * @param {Object} results - Object with arrays of items for each type
 * @param {number} budget - Maximum budget allowed
 * @param {number} numberOfPeople - Number of people
 * @param {number} startTime - Start time in hours (24-hour format)
 * @returns {Array<Object>} Array of valid itinerary combinations with cost and time info
 */
function generateItineraries(preferredTypes, results, budget, numberOfPeople, startTime) {
  if (!preferredTypes || preferredTypes.length === 0) {
    return [];
  }

  // Parse preferredTypes to get items for each position with their types
  const positions = preferredTypes.map(item => {
    const [type, value] = Object.entries(item)[0];
    
    // Check if value is an empty object or has no keys
    const isEmpty = Object.keys(value).length === 0;
    
    if (isEmpty) {
      // Use all results for this type
      return {
        type,
        items: results[type] || []
      };
    } else {
      // Use the specific object provided
      return {
        type,
        items: [value]
      };
    }
  });

  // Filter out positions with no items
  const validPositions = positions.filter(pos => pos.items.length > 0);
  
  if (validPositions.length === 0) {
    return [];
  }

  // Generate cartesian product of all position combinations
  function cartesianProduct(arrays) {
    if (arrays.length === 0) return [[]];
    
    const [first, ...rest] = arrays;
    const restProduct = cartesianProduct(rest);
    
    const result = [];
    for (const item of first) {
      for (const combo of restProduct) {
        result.push([item, ...combo]);
      }
    }
    return result;
  }

  const itemArrays = validPositions.map(pos => pos.items);
  const allCombinations = cartesianProduct(itemArrays);

  // Filter by budget only (time validation happens after enrichment)
  const budgetValidItineraries = allCombinations
    .map(itinerary => {
      const totalCost = itinerary.reduce((sum, item) => {
        return sum + (item.pricePerPerson || 0) * numberOfPeople;
      }, 0);

      // Format itinerary to maintain structure: [{ type: item }, { type: item }, ...]
      const formattedItinerary = itinerary.map((item, index) => ({
        [validPositions[index].type]: item
      }));

      return {
        itinerary: formattedItinerary,
        totalCost
      };
    })
    .filter(item => item.totalCost <= budget);

  return budgetValidItineraries;
}

export async function POST(request) {
  try {
    await connectMongo();
    
    const body = await request.json();
    const {
      // Mandatory fields
      startTime,              // Number: 24-hour format (e.g., 18)
      preferredTypes,         // Array: [{ "dinings": {} }, { "movies": obj }]
      budget,                 // Number: total budget
      numberOfPeople,         // Number
      startLocation,          // Object: { lat, lng }
      
      // Optional fields
      endTime,                // Number: 24-hour format
      endLocation,            // Object: { lat, lng }
      extraInfo,              // String
      parkingAccessible,      // Boolean
      crowdTolerance,         // String
      travelTolerance,        // Number
      timeGapBetweenThings,   // Number: minutes
      minimumRating,          // Number: e.g., 4.0
      
      // Type-specific filters
      dining,                 // Object: { type: [String], cuisines: [String], alcohol: Boolean }
      event,                  // Object: { type: [String], venue: [String] }
      activity,               // Object: { type: [String], venue: [String] }
      play,                   // Object: { type: [String], venue: [String], intensity: [String] }
      movie                   // Object: { genre: [String], language: [String], format: [String], cast: [String] }
    } = body;

    // Validate only mandatory fields
    if (!startTime || !preferredTypes || !budget || !numberOfPeople || !startLocation) {
      return NextResponse.json(
        { error: "Missing required fields: startTime, preferredTypes, budget, numberOfPeople, startLocation" },
        { status: 400 }
      );
    }

    // Extract unique types (all types from preferredTypes, whether empty object or specific)
    let uniqueTypes = [];
    if (Array.isArray(preferredTypes)) {
      const allTypes = preferredTypes
        .filter(item => typeof item === 'object' && item !== null)
        .map(item => Object.keys(item)[0])
        .filter(type => type); // Remove any undefined/null
      
      uniqueTypes = [...new Set(allTypes)];
    }
    
    // Extract hours in 24-hour format (0-23)
    const startHour = startTime - 1; // startTime - 1 hour
    const endHour = endTime + 1; // endTime + 1 hour
    
    const maxPrice = (budget * 1.25) / numberOfPeople;

    // Base query for all types
    const baseQuery = {
      minPeople: { $lte: numberOfPeople },
      maxPeople: { $gte: numberOfPeople },
      pricePerPerson: { $lte: maxPrice },
      availableTimeStart: { $lte: startHour },
      availableTimeEnd: { $gte: endHour }
    };

    // Add minimum rating if provided
    if (minimumRating) {
      baseQuery.rating = { $gte: minimumRating };
    }
    
    const results = {};
    const modelMap = {
      dinings: Dining,
      events: Event,
      activities: Activity,
      movies: Movie,
      plays: Play
    };

    // Query each type with specific filters
    for (const type of uniqueTypes) {
      const model = modelMap[type.toLowerCase()];
      if (!model) continue;

      const typeQuery = { ...baseQuery };

      // Apply type-specific filters - DB fields are arrays, use $in to match ANY value
      switch (type.toLowerCase()) {
        case 'dinings':
          if (dining) {
            if (Array.isArray(dining.type) && dining.type.length > 0) {
              typeQuery.type = { $in: dining.type };
            }
            if (Array.isArray(dining.cuisines) && dining.cuisines.length > 0) {
              typeQuery.cuisines = { $in: dining.cuisines };
            }
            if (dining.alcohol !== undefined) {
              typeQuery.alcohol = dining.alcohol;
            }
          }
          break;

        case 'events':
          if (event) {
            if (Array.isArray(event.type) && event.type.length > 0) {
              typeQuery.type = { $in: event.type };
            }
            if (Array.isArray(event.venue) && event.venue.length > 0) {
              typeQuery.venue = { $in: event.venue };
            }
          }
          break;

        case 'activities':
          if (activity) {
            if (Array.isArray(activity.type) && activity.type.length > 0) {
              typeQuery.type = { $in: activity.type };
            }
            if (Array.isArray(activity.venue) && activity.venue.length > 0) {
              typeQuery.venue = { $in: activity.venue };
            }
          }
          break;

        case 'plays':
          if (play) {
            if (Array.isArray(play.type) && play.type.length > 0) {
              typeQuery.type = { $in: play.type };
            }
            if (Array.isArray(play.venue) && play.venue.length > 0) {
              typeQuery.venue = { $in: play.venue };
            }
            if (Array.isArray(play.intensity) && play.intensity.length > 0) {
              typeQuery.intensity = { $in: play.intensity };
            }
          }
          break;

        case 'movies':
          if (movie) {
            if (Array.isArray(movie.genre) && movie.genre.length > 0) {
              typeQuery.genre = { $in: movie.genre };
            }
            if (Array.isArray(movie.language) && movie.language.length > 0) {
              typeQuery.language = { $in: movie.language };
            }
            if (Array.isArray(movie.format) && movie.format.length > 0) {
              typeQuery.format = { $in: movie.format };
            }
            if (Array.isArray(movie.cast) && movie.cast.length > 0) {
              typeQuery.cast = { $in: movie.cast };
            }
          }
          break;
      }

      results[type] = await model.find(typeQuery).limit(50).lean();
    }

    // Generate all possible itinerary combinations with budget and time constraints
    const itineraries = generateItineraries(preferredTypes, results, budget, numberOfPeople, startTime);

    // Enrich itineraries with travel distance and time (validates time constraints)
    const validItineraries = await enrichItinerariesWithTravel(itineraries, startLocation, startTime, process.env.OPENROUTE_API_KEY);

    // Score itineraries using AI (batchSize=1 processes one at a time)
    const scoredItineraries = await scoreItineraries(validItineraries, body, 1);
    
    // Extract just the scores array (already sorted highest to lowest)
    const scores = scoredItineraries.map(item => item.score);

    return NextResponse.json({
      success: true,
      scores: scores,
      totalCombinations: scores.length
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error.message },
      { status: 400 }
    );
  }
}
