
import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongo";
import Dining from "@/app/models/Dining";

export async function GET() {
  try {
    await connectMongo();
    
    // Get all unique cuisines from the database
    const uniqueCuisines = await Dining.distinct('cuisines');
    
    // Sort alphabetically
    const sortedCuisines = uniqueCuisines.sort();
    
    return NextResponse.json({
      success: true,
      cuisines: sortedCuisines
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching cuisines:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cuisines", details: error.message },
      { status: 500 }
    );
  }
}
