import mongoose, {mongo} from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server"

const MONGO_MEMORY_SERVER_PORT = process.env.MONGO_MEMORY_SERVER_PORT || 10000;
const MONGODB_URL = ""


let mongoServer = null
let dbInstance: any = undefined

const connectDB = async () => {
  try {
    await mongoose.disconnect()

    mongoServer = await MongoMemoryServer.create({
      instance:  {
        port: +MONGO_MEMORY_SERVER_PORT
      }
    })

    await mongoose.connect(MONGODB_URL)
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1)
  }
}

export const clearDB = async (collectionName = null)  => {
  if (!dbInstance) {
    dbInstance = await mongoose.connect(MONGODB_URL)
  }

  const connection = mongoose.connection
  if (collectionName) {
    await connection.db.collection(collectionName).deleteMany({})
  } else {
    const collections = await connection.db.listCollections().toArray()
    const collectionNames = collections.map((col) => col.name)
    
    for(let name of collectionNames) {
      await connection.db.collection(name).deleteMany({})
    } 
  }
}

export default connectDB