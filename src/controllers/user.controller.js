import jwt from "jsonwebtoken";
import { options } from "../constants.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
import { generateAccessAndRefreshTokens } from "../helpers/user.helper.js";

/**
 * Register new user(Post)
 */
const registerUser = asyncHandler(async (req, res) => {
  //get user details from fronted or postman
  const { username, fullName, email, password } = req.body;
  //do some validation --> Empty check
  if (
    [username, fullName, email, password].some(
      eachItem => eachItem?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists: username, email
  let existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(
      409,
      "User already registered. Please log in or use a different email/username."
    );
  }

  //check for images, check for avatar
  console.log("Check Request Fils array :>", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //check coverImage validation
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //upload images on cloudinary/aws(s3), check url (avator)
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file Is required(missing file)");
  }

  //upload on cloudinary'
  const avatarRes = await uploadOnCloudinary(avatarLocalPath);
  const coverImageRes = await uploadOnCloudinary(coverImageLocalPath);

  //check the avatar Response
  if (!avatarRes) {
    throw new ApiError(500, "Server Error while Uploading Avatar");
  }

  //create a object all details - create entry on database
  const createdUser = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatarRes.secure_url,
    coverImage: coverImageRes ? coverImageRes.secure_url : "",
  });

  //remove password and refresh token field from response
  const updatedUser = await User.findById(createdUser._id).select(
    "-password -refreshToken"
  );

  //check for user creation
  if (!updatedUser) {
    throw new ApiError(500, "Something went wrong creating your account");
  }

  // return response
  res
    .status(201)
    .json(new ApiResponse(200, updatedUser, "User registered Successfully"));
});

/**
 * Login User(Post)
 */
const loginUser = asyncHandler(async (req, res) => {
  //get data from fronted/Postman--> email/username, password
  const { username, email, password } = req.body;
  //validation check username or email
  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  //find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Email or Password");
  }

  //access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  //remove refresh token and password(for fronted we don't send)
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //send cookie
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

/**
 * Logout User(Post)
 */
const logoutUser = asyncHandler(async () => {
  //get user id from verifyJwt middleware and set token as undefined
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

/**
 * Refresh  Access token if expired
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken)
    throw new ApiError(401, "No token provided(unauthorized request)");

  try {
    const decodedToken = await jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //get user data from database
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid credentials (user not found)");
    }

    //check if the refresh token is match or not
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    //genrate a new refresh token and access token
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user?._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Token Successfully Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});

/**
 * Change Current password(PUT)
 */
const changeCurrentPassword = asyncHandler(async (req, res) => {
  //req oldPassword and newPassword data from req.body
  const { oldPassword, newPassword } = req.body;

  //find the user
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User Not Found!");
  }
  //check old password is correct or not
  const isMatched = await user.isPasswordCorrect(oldPassword);
  if (!isMatched) {
    throw new ApiError(400, "wrong password please check old password");
  }

  //set new password to user model
  user.password = newPassword;
  //then update password
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password update successfully"));
});

/**
 * get current user Details (GET)
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "user data fetch successfully"));
});

/**
 * Update Account Details(PUT/Pitch)
 */
const updateAccountUser = asyncHandler(async (req, res) => {
  //user data from req.body
  const { username, email, fullName } = req.body;
  //add some validation
  if (!(username || email) && !fullName) {
    throw new ApiError(400, "All Fields are required");
  }
  //find user by id and update new data
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        $or: [{ username }, { email }],
        fullName,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  //return response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "User Data Update successfully"));
});

/**
 * Update User Avatar image
 */
const updateUserAvatar = asyncHandler(async (req, res) => {
  //get avatarlocalpath from file
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  //then upload on cloudinary
  const avatarResponse = await uploadOnCloudinary(avatarLocalPath);
  //check cloudinary response
  if (!avatarResponse.url) {
    throw new ApiError(500, "Error while uploading on avatar");
  }

  //update new url on database
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatarResponse.secure_url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  //send the response
  res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "avatar update successfully"));
});

/**
 * Update User Cover Image
 */
const updateUserCoverImage = asyncHandler(async (req, res) => {
  //get cover image file form
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(401, "cover image file is missing");
  }

  //upload cover image file to cloudinary
  const coverImageRes = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImageRes.secure_url) {
    throw new ApiError(400, "error while uploading cover image");
  }

  const updateUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImageRes.secure_url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  res
    .staus(200)
    .json(new ApiResponse(200, updateUser, "update cover image successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountUser,
  updateUserAvatar,
  updateUserCoverImage,
};
