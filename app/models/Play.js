
import mongoose from "mongoose";

const PlaySchema = new mongoose.Schema({
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

  // Play specific fields
  venue: [{
    type: String,
    enum: ["indoor", "outdoor"]
  }],
  type: [{
    type: String,
    enum: [
      "Badminton",
      "Basketball",
      "Box Cricket",
      "Cricket",
      "Cricket Nets",
      "Football",
      "Padel",
      "Pickleball",
      "Table Tennis",
      "Tennis",
      "Turf Football"
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

export default mongoose.models.Play ||
  mongoose.model("Play", PlaySchema);
