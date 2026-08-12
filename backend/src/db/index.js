import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export let dbInstance = undefined

export const connectdb = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
    dbInstance = connectionInstance
    console.log(`🍀 MongoDB connected !! DB host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1)
  }
}