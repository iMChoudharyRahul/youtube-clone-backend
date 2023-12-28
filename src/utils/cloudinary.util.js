import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with API credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async localFilePath => {
  try {
    // Check if the local file path is not available
    if (!localFilePath) return console.log("File Path is not found");

    // Upload the file to Cloudinary with auto-detected resource type
    const fileUpload = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // Log a success message with the Cloudinary URL
    console.log("Check Full Object From Cloudinary >:", fileUpload);
    console.log("File is uploaded on cloudinary >:", fileUpload.url);
    // Remove the locally saved temporary file
    fs.unlinkSync(localFilePath);

    // Return the Cloudinary upload response
    return fileUpload;
  } catch (error) {
    // Remove the locally saved temporary file in case of upload failure
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    // Return null to indicate upload failure
    return null;
  }
};

export { uploadOnCloudinary };
