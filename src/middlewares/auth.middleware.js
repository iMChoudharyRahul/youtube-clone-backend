import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    //we get a token from cookie or header
    const token =
      req.cookie?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(400, "Unauthorized request");
    }

    //decoded the token using secret key
    const decodedToken = await jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );

    //get user data from database using decoded token
    const userData = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!userData) {
      throw new ApiError(401, "Invalid Access Token");
    }

    //save data on request
    req.user = userData;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

export { verifyJwt };
