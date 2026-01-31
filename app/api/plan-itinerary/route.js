
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
 * Generate all possible itinerary combinations respecting order
 * @param {Array<Object>} results - Array of {type, items, filters?} in order
 * @param {number} budget - Maximum budget allowed
 * @param {number} numberOfPeople - Number of people
 * @returns {Array<Object>} Array of valid itinerary combinations with cost and time info
 */
function generateItineraries(results, budget, numberOfPeople) {
  // Filter out positions with no items
  const validPositions = results.filter(pos => pos.items && pos.items.length > 0);
  
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
      travelTolerance,        // [String]: Array of "low", "medium", "high"
      
      // Go-out specific filters
      dining,                 // Object: { type: [String], cuisines: [String], alcohol: Boolean, wifi: Boolean, washroom: Boolean, wheelchair: Boolean, parking: Boolean, rating: Number, crowdTolerance: [String] }
      event,                  // Object: { type: [String], venue: [String], wifi: Boolean, washroom: Boolean, wheelchair: Boolean, parking: Boolean, rating: Number, crowdTolerance: [String] }
      activity,               // Object: { type: [String], venue: [String], wifi: Boolean, washroom: Boolean, wheelchair: Boolean, parking: Boolean, rating: Number, crowdTolerance: [String] }
      play,                   // Object: { type: [String], venue: [String], intensity: [String], wifi: Boolean, washroom: Boolean, wheelchair: Boolean, cafe: Boolean, parking: Boolean, rating: Number, crowdTolerance: [String] }
      movie                   // Object: { genre: [String], language: [String], format: [String], cast: [String], wifi: Boolean, washroom: Boolean, wheelchair: Boolean, parking: Boolean, rating: Number, crowdTolerance: [String] }
    } = body;

    // Validate only mandatory fields
    if (!startTime || !preferredTypes || !budget || !numberOfPeople || !startLocation) {
      return NextResponse.json(
        { error: "Missing required fields: startTime, preferredTypes, budget, numberOfPeople, startLocation" },
        { status: 400 }
      );
    }

    console.log('📥 Received preferredTypes:', JSON.stringify(preferredTypes, null, 2));
    
    // Extract hours in 24-hour format (0-23)
    const startHour = startTime - 1; // startTime - 1 hour
    const maxPrice = (budget * 1.25) / numberOfPeople;

    // Base query for all types
    const baseQuery = {
      minPeople: { $lte: numberOfPeople },
      maxPeople: { $gte: numberOfPeople },
      pricePerPerson: { $lte: maxPrice },
      availableTimeStart: { $lte: startHour }
    };

    // Only add endTime filter if provided
    if (endTime) {
      const endHour = endTime + 1; // endTime + 1 hour
      baseQuery.availableTimeEnd = { $gte: endHour };
    }
    
    const modelMap = {
      dinings: Dining,
      events: Event,
      activities: Activity,
      movies: Movie,
      plays: Play
    };

    // Build results array by looping through preferredTypes in order
    const results = [];
    
    for (const item of preferredTypes) {
      const typeName = Object.keys(item)[0]; // e.g., "dinings", "movies"
      const value = item[typeName];
      
      console.log(`Processing ${typeName}:`, JSON.stringify(value, null, 2));
      
      // Check if this is a specific venue (has _id) or needs filtering
      if (value._id) {
        // Specific venue provided - use it directly as a single-item array
        console.log(`  → Using specific venue for ${typeName}`);
        results.push({
          type: typeName,
          items: [value]
        });
      } else if (value.filters !== undefined || Object.keys(value).length === 0) {
        // Has filters object OR is empty object (for backwards compatibility) - query the database
        const model = modelMap[typeName.toLowerCase()];
        if (!model) {
          results.push({ type: typeName, items: [] });
          continue;
        }

        const typeQuery = { ...baseQuery };
        // Handle both { filters: {} } and {} (backwards compatibility)
        const filters = value.filters !== undefined ? value.filters : value;
        console.log(`  → Applying filters:`, JSON.stringify(filters, null, 2));

        // Apply type-specific filters based on the go-out type
        switch (typeName.toLowerCase()) {
          case 'dinings':
            if (Array.isArray(filters.type) && filters.type.length > 0) {
              typeQuery.type = { $in: filters.type };
            }
            if (Array.isArray(filters.cuisines) && filters.cuisines.length > 0) {
              typeQuery.cuisines = { $in: filters.cuisines };
            }
            if (filters.alcohol !== undefined) {
              typeQuery.alcohol = filters.alcohol;
            }
            break;

          case 'events':
            if (Array.isArray(filters.type) && filters.type.length > 0) {
              typeQuery.type = { $in: filters.type };
            }
            if (Array.isArray(filters.venue) && filters.venue.length > 0) {
              typeQuery.venue = { $in: filters.venue };
            }
            break;

          case 'activities':
            if (Array.isArray(filters.type) && filters.type.length > 0) {
              typeQuery.type = { $in: filters.type };
            }
            if (Array.isArray(filters.venue) && filters.venue.length > 0) {
              typeQuery.venue = { $in: filters.venue };
            }
            if (Array.isArray(filters.intensity) && filters.intensity.length > 0) {
              typeQuery.intensity = { $in: filters.intensity };
            }
            break;

          case 'plays':
            if (Array.isArray(filters.type) && filters.type.length > 0) {
              typeQuery.type = { $in: filters.type };
            }
            if (Array.isArray(filters.venue) && filters.venue.length > 0) {
              typeQuery.venue = { $in: filters.venue };
            }
            if (Array.isArray(filters.intensity) && filters.intensity.length > 0) {
              typeQuery.intensity = { $in: filters.intensity };
            }
            if (filters.cafe !== undefined) {
              typeQuery.cafe = filters.cafe;
            }
            break;

          case 'movies':
            if (Array.isArray(filters.genre) && filters.genre.length > 0) {
              typeQuery.genre = { $in: filters.genre };
            }
            if (Array.isArray(filters.language) && filters.language.length > 0) {
              typeQuery.language = { $in: filters.language };
            }
            if (Array.isArray(filters.format) && filters.format.length > 0) {
              typeQuery.format = { $in: filters.format };
            }
            if (Array.isArray(filters.cast) && filters.cast.length > 0) {
              typeQuery.cast = { $in: filters.cast };
            }
            break;
        }

        // Apply common amenity filters
        if (filters.wifi !== undefined) {
          typeQuery.wifi = filters.wifi;
        }
        if (filters.washroom !== undefined) {
          typeQuery.washroom = filters.washroom;
        }
        if (filters.wheelchair !== undefined) {
          typeQuery.wheelchair = filters.wheelchair;
        }
        if (filters.parking !== undefined) {
          typeQuery.parking = filters.parking;
        }
        if (filters.rating !== undefined) {
          typeQuery.rating = { $gte: filters.rating };
        }

        const queryResults = await model.find(typeQuery).limit(50).lean();
        console.log(`  → Query returned ${queryResults.length} results for ${typeName}`);
        results.push({
          type: typeName,
          items: queryResults,
          filters: filters // Store filters for AI scoring
        });
      } else {
        // Empty object or invalid - skip
        console.log(`  → Skipping ${typeName} (no filters or _id)`);
        results.push({ type: typeName, items: [] });
      }
    }

    console.log('📊 Final results summary:', results.map(r => `${r.type}: ${r.items.length} items`).join(', '));

    // Check if any required types have no results
    const emptyTypes = results.filter(r => r.items.length === 0);
    if (emptyTypes.length > 0) {
      const emptyTypeNames = emptyTypes.map(r => r.type).join(', ');
      console.warn(`⚠️ No results found for: ${emptyTypeNames}`);
      
      return NextResponse.json({
        success: false,
        error: `No venues found for: ${emptyTypeNames}`,
        details: `We couldn't find any ${emptyTypeNames} matching your criteria (budget, time, location, number of people). Please try adjusting your filters or constraints.`,
        emptyTypes: emptyTypeNames
      }, { status: 200 });
    }

    // Generate all possible itinerary combinations with budget and time constraints
    const itineraries = generateItineraries(results, budget, numberOfPeople);

    // Enrich itineraries with travel distance and time (validates time constraints)
    const validItineraries = await enrichItinerariesWithTravel(itineraries, startLocation, startTime, process.env.OPENROUTE_API_KEY);

    // Check if no valid itineraries after time validation
    if (validItineraries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No new permutations available',
        noNewPermutations: true
      }, { status: 200 });
    }

    // Score itineraries using AI (batchSize=1 processes one at a time)
    const scoredItineraries = await scoreItineraries(validItineraries, body, 1);
    
    // Remove duplicate itineraries - ensure no venue appears in multiple selected itineraries
    const uniqueItineraries = [];
    const usedVenues = new Set();
    
    for (const itinerary of scoredItineraries) {
      // Get all venue IDs/names in this itinerary
      const venueIds = itinerary.itinerary.map(item => {
        const typeName = Object.keys(item)[0];
        const venue = item[typeName];
        // Create a unique identifier for the venue
        if (venue._id) {
          return String(venue._id);
        } else if (venue.name) {
          return venue.name.toLowerCase().trim();
        } else {
          return JSON.stringify(venue);
        }
      });
      
      // Check if any venue in this itinerary has been used before
      const hasUsedVenue = venueIds.some(venueId => usedVenues.has(venueId));
      
      // Only add this itinerary if all its venues are new
      if (!hasUsedVenue) {
        uniqueItineraries.push(itinerary);
        // Mark all venues in this itinerary as used
        venueIds.forEach(venueId => usedVenues.add(venueId));
      }
      
      // Stop once we have 4 unique itineraries
      if (uniqueItineraries.length >= 4) {
        break;
      }
    }
    
    console.log(`Total scored itineraries: ${scoredItineraries.length}`);
    console.log(`Unique itineraries (no shared venues): ${uniqueItineraries.length}`);
    console.log(`Total unique venues used: ${usedVenues.size}`);

    return NextResponse.json({
      success: true,
      itineraries: uniqueItineraries,
      totalCombinations: uniqueItineraries.length
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error.message },
      { status: 400 }
    );
  }
}
