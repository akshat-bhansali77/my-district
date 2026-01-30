
import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  name: String,
  location: {
    lat: Number,
    lng: Number
  },
  pricePerPerson: Number,
  duration: Number,
  
  // Availability fields
  minPeople: Number,
  maxPeople: Number,
  availableTimeStart: Number,
  availableTimeEnd: Number,

  // Activity specific fields
  venue: [{
    type: String,
    enum: ["indoor", "outdoor"]
  }],
  type: [{
    type: String,
    enum: [
      "Bowling",
      "Acting Workshops",
      "Adventure",
      "Adventure Parks",
      "Aerial Tours",
      "Arcades",
      "Art & Craft Workshops",
      "Baking",
      "Bike Riding",
      "Blood on the Clocktower",
      "Board Games & Puzzles",
      "Bollywood Dance",
      "Business Conferences & Talks",
      "Calligraphy",
      "Celebrations",
      "Ceramics",
      "City Tours",
      "Clay Modelling",
      "Coffee Brewing",
      "Comedy",
      "Community Meetups",
      "Community Runs",
      "Conferences & Talks",
      "Cooking",
      "Cricket",
      "Culinary Workshops",
      "DIY Workshops",
      "Dance Workshops",
      "Dating",
      "Day Trips",
      "Entertainment Parks",
      "Escape Rooms",
      "Esports",
      "Farm Outings",
      "Fashion & Beauty Workshops",
      "Fests & Fairs",
      "Finance Workshops",
      "Fitness Activities",
      "Game Zones",
      "Games & Quizzes",
      "Go Karting",
      "Healing",
      "Historical Tours",
      "History Museums",
      "Home Decor",
      "Horse Riding",
      "Illusion Museums",
      "Improv",
      "Interest Based Communities",
      "Interest Based Dating",
      "Kids",
      "Kids Festivals",
      "Kids Play",
      "Kids Theme Parks",
      "Laser Tag",
      "Meditation",
      "Mountain Treks",
      "Museums",
      "Music",
      "Mystery Rooms",
      "NYE",
      "Nightlife",
      "Paintball",
      "Painting",
      "Paragliding",
      "Parties",
      "Pet Activities",
      "Pet Playdates",
      "Photography Workshops",
      "Play Areas",
      "Play Sports",
      "Pottery Workshops",
      "Public Speaking Workshops",
      "Rage Rooms",
      "Resin Art",
      "Rock Climbing",
      "Sip & Paint",
      "Snow Parks",
      "Social Mixers",
      "Theme Parks",
      "Tours",
      "Trampoline Parks",
      "Travel",
      "Treasure Hunts",
      "Treks",
      "Trivia Nights & Quizzes",
      "VR Rooms",
      "Valentine's Day",
      "Watercolours",
      "Weekend Getaways",
      "Wellness Workshops",
      "Wheel Throwing",
      "Workshops"
    ]
  }],
  intensity: [{
    type: String,
    enum: ["low", "medium", "high"]
  }],

  tags: [String],
  parking: Boolean,
  rating: Number
}, {
  timestamps: true
});

export default mongoose.models.Activity ||
  mongoose.model("Activity", ActivitySchema);
