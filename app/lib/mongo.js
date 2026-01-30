import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/my-district";

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null };
}

export async function connectMongo() {
  if (cached.conn) return cached.conn;

  cached.conn = await mongoose.connect(MONGO_URI);
  return cached.conn;
}
