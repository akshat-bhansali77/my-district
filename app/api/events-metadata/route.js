
import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongo";
import Event from "@/app/models/Event";

export async function GET() {
  try {
    await connectMongo();
    
    // Get all unique values for type and venue from the database
    const uniqueTypes = await Event.distinct('type');
    const uniqueVenues = await Event.distinct('venue');
    
    // Sort alphabetically
    const sortedTypes = uniqueTypes.sort();
    const sortedVenues = uniqueVenues.sort();
    
    return NextResponse.json({
      success: true,
      types: sortedTypes,
      venues: sortedVenues
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching event metadata:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event metadata", details: error.message },
      { status: 500 }
    );
  }
}
