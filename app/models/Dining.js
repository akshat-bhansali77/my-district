
import mongoose from "mongoose";

const DiningSchema = new mongoose.Schema({
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

  // Dining specific fields
  type: [{
    type: String,
    enum: ["veg", "non-veg", "both"]
  }],
  cuisines: [String],
  alcohol: Boolean,

  tags: [String],
  parking: Boolean,
  rating: Number
}, {
  timestamps: true
});

export default mongoose.models.Dining ||
  mongoose.model("Dining", DiningSchema);
