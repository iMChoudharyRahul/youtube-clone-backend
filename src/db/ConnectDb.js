import mongoose from "mongoose";

const connectDB = async ()=> {
    try {
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("error from Connection db:", error);
        process.exit(1);
    }
}

export default connectDB;