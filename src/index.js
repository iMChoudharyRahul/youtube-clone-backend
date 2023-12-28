/**
 * What We add on Index js File 
 * ##connection with database 
 * ## dot env file config 
 */
import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/ConnectDb.js";

// Load environment variables from .env file
dotenv.config({
    path: "../.env",
});

connectDB()
.then(()=> {
    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🎁 Server started on port ${PORT}`));
})
.catch((error)=> {
console.log("MongoDB connection Failed !!", error);
});