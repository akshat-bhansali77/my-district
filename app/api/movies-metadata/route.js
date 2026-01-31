
import { NextResponse } from "next/server";
import { connectMongo } from "@/app/lib/mongo";
import Movie from "@/app/models/Movie";

export async function GET() {
  try {
    await connectMongo();
    
    // Get all unique values for genre, format, and cast from the database
    const uniqueGenres = await Movie.distinct('genre');
    const uniqueFormats = await Movie.distinct('format');
    const uniqueCast = await Movie.distinct('cast');
    
    // Sort alphabetically
    const sortedGenres = uniqueGenres.sort();
    const sortedFormats = uniqueFormats.sort();
    const sortedCast = uniqueCast.sort();
    
    return NextResponse.json({
      success: true,
      genres: sortedGenres,
      formats: sortedFormats,
      cast: sortedCast
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching movie metadata:', error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch movie metadata", details: error.message },
      { status: 500 }
    );
  }
}
