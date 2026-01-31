
import mongoose from "mongoose";

const OrderHistorySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  
  // Order metadata
  orderDate: {
    type: Date,
    default: Date.now
  },
  
  // User/trip information
  numberOfPeople: {
    type: Number,
    required: true
  },
  
  startTime: {
    type: Number,
    required: true
  },
  
  startLocation: {
    lat: Number,
    lng: Number
  },
  
  endTime: Number,
  
  endLocation: {
    lat: Number,
    lng: Number
  },
  
  // Itinerary details - array of activities
  itinerary: [{
    type: {
      type: String,
      enum: ['dinings', 'movies', 'events', 'activities', 'plays']
    },
    venue: {
      _id: mongoose.Schema.Types.ObjectId,
      name: String,
      description: String,
      location: {
        lat: Number,
        lng: Number
      },
      address: String,
      pricePerPerson: Number,
      duration: Number,
      availableTimeStart: Number,
      availableTimeEnd: Number,
      distanceKm: Number,
      travelTimeMinutes: Number,
      banner_url: String,
      district_url: String,
      rating: Number,
      
      // Amenities
      wifi: Boolean,
      washroom: Boolean,
      wheelchair: Boolean,
      parking: Boolean,
      
      // Type-specific fields (stored as mixed to handle different types)
      typeSpecificData: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Financial summary
  totalBudget: {
    type: Number,
    required: true
  },
  
  totalDistance: Number,
  totalDuration: Number,
  
  // Optional user preferences stored
  extraInfo: String,
  travelTolerance: [String],
  
  // Score from AI (if available)
  score: Number
  
}, {
  timestamps: true
});

export default mongoose.models.OrderHistory || 
  mongoose.model("OrderHistory", OrderHistorySchema);
