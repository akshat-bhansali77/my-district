import { NextResponse } from "next/server";
import { getDistanceMatrix, getDistance } from "@/app/lib/openroute";

export async function POST(request) {
  try {
    const body = await request.json();
    const { start, end, locations, apiKey, sources, destinations } = body;

    // Validate API key
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // If locations array is provided, get distance matrix
    if (locations && Array.isArray(locations) && locations.length >= 2) {
      const result = await getDistanceMatrix(locations, apiKey, sources, destinations);
      return NextResponse.json(result);
    }

    // Otherwise, get single distance between start and end
    if (!start || !end) {
      return NextResponse.json(
        { error: "Either 'locations' array or both 'start' and 'end' are required" },
        { status: 400 }
      );
    }

    const result = await getDistance(start, end, apiKey);
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request", details: error.message },
      { status: 400 }
    );
  }
}
