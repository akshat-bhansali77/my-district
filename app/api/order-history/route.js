
import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongo";
import OrderHistory from "@/app/models/OrderHistory";

/**
 * GET - Retrieve all order history
 */
export async function GET(request) {
  try {
    await connectMongo();
    
    // Get all orders sorted by newest first
    const orders = await OrderHistory.find({})
      .sort({ orderDate: -1 })
      .lean();
    
    return NextResponse.json({
      success: true,
      orders
    });
    
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch order history',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST - Create new order
 */
export async function POST(request) {
  try {
    await connectMongo();
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.itinerary || !Array.isArray(body.itinerary) || body.itinerary.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid itinerary data'
      }, { status: 400 });
    }
    
    if (!body.numberOfPeople || !body.startTime || !body.totalBudget) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Transform itinerary to match schema
    const transformedItinerary = body.itinerary.map(item => {
      const typeName = Object.keys(item)[0];
      const venue = item[typeName];
      
      return {
        type: typeName,
        venue: {
          _id: venue._id,
          name: venue.name,
          description: venue.description,
          location: venue.location,
          address: venue.address,
          pricePerPerson: venue.pricePerPerson,
          duration: venue.duration,
          availableTimeStart: venue.availableTimeStart,
          availableTimeEnd: venue.availableTimeEnd,
          distanceKm: venue.distanceKm,
          travelTimeMinutes: venue.travelTimeMinutes,
          banner_url: venue.banner_url,
          district_url: venue.district_url,
          rating: venue.rating,
          wifi: venue.wifi,
          washroom: venue.washroom,
          wheelchair: venue.wheelchair,
          parking: venue.parking,
          // Store type-specific data
          typeSpecificData: {
            type: venue.type,
            cuisines: venue.cuisines,
            alcohol: venue.alcohol,
            genre: venue.genre,
            language: venue.language,
            format: venue.format,
            cast: venue.cast,
            venue: venue.venue,
            intensity: venue.intensity,
            cafe: venue.cafe
          }
        }
      };
    });
    
    // Create order document
    const orderData = {
      numberOfPeople: body.numberOfPeople,
      startTime: body.startTime,
      startLocation: body.startLocation,
      endTime: body.endTime,
      endLocation: body.endLocation,
      itinerary: transformedItinerary,
      totalBudget: body.totalBudget,
      totalDistance: body.totalDistance,
      totalDuration: body.totalDuration,
      extraInfo: body.extraInfo,
      travelTolerance: body.travelTolerance,
      score: body.score
    };
    
    const order = await OrderHistory.create(orderData);
    
    return NextResponse.json({
      success: true,
      order,
      message: 'Order saved successfully!'
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    }, { status: 500 });
  }
}
