import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";

/**
 * Generate Access And Refresh Token
 * @param {*} userId
 * @returns {accessToken, refreshToken}
 */
const generateAccessAndRefreshTokens = async userId => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(401, "User not found");

    // Generate access token and refresh token
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //save accessToken on database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

export { generateAccessAndRefreshTokens };
