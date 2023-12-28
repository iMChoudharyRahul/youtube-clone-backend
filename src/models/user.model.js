import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the user schema for MongoDB using Mongoose
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    fullName: {
      type: String,
      require: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String,
      require: true, // Cloudinary URL for the user's avatar
    },
    coverImage: {
      type: String, // Cloudinary URL for the user's cover image
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      require: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, // Enable timestamps for created and updated fields
  }
);

// Mongoose Middleware: Pre-save hook to hash the user's password before saving
userSchema.pre("save", async function (next) {
  // If password not modified, skip hashing
  if (!this.isModified("password")) return next();

  // Hash the password with bcrypt (10 rounds of encryption)
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//methods is object we can create multiple our methods on userSchema
// Mongoose Method: Check if the provided password is correct
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//Generate Access Token --> we don't save access token on db
/**
 * Mongoose Method: Generate an access token for the user
 * sign(payload, secretKey, expireTime)
 */
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Mongoose Method: Generate a refresh token for the user
userSchema.methods.generateRefreshToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
// Export the User model based on the user schema
export const User = mongoose.model("User", userSchema);
