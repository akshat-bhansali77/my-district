
import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongo";
import Activity from "@/app/models/Activity";

export async function GET() {
  try {
    await connectMongo();
    
    // Get all unique values for type, venue, and intensity from the database
    const uniqueTypes = await Activity.distinct('type');
    const uniqueVenues = await Activity.distinct('venue');
    const uniqueIntensities = await Activity.distinct('intensity');
    
    // Sort alphabetically
    const sortedTypes = uniqueTypes.sort();
    const sortedVenues = uniqueVenues.sort();
    const sortedIntensities = uniqueIntensities.sort();
    
    return NextResponse.json({
      success: true,
      types: sortedTypes,
      venues: sortedVenues,
      intensities: sortedIntensities
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching activity metadata:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity metadata", details: error.message },
      { status: 500 }
    );
  }
}
