import dotenv from "dotenv"

dotenv.config({
  path: "../.env"
})
import { httpServer } from "../src/app.js"
import connectDB from "./db.js";

const PORT = process.env.PORT || 8080;

const startServer = () => {
  httpServer.listen(PORT, () => {
    console.log("Server is running on port: ", PORT);
  })
}

connectDB()
  .then(() => {
    startServer()
  })
  .catch(
    (err) => {
      console.log("MongoDB connection failed", err);
      
  })