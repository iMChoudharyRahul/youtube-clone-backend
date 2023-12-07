import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
      require: true, //Cloudinary url
    },
    coverImage: {
      type: String, //Cloudinary url
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
    timestamps: true,
  }
);

//Mongoose Methord
userSchema.pre('save', async function(next){
    //if password not update then 
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10); // pass incryption on 10 time 
    next();
});

//Check the password is correct or not 
//methods is object we can create multiple our methods on userschema 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

//Generate Access Token --> we don't save access token on db 
/**
 * sign(paylod, secreateKey, expiryTime)
 */
userSchema.methods.generateAccessToken = async function(){
     return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
     )
} 
//Generate Refresh Token
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
} 

export const User = mongoose.model("User", userSchema);
