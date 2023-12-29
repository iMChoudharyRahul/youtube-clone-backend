import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = Router();

/**
 * User Api Route
 */
/**
 * Register User
 * we have two syntax to define the routes
 */
// Method 1: define route separately
// router.route("/register").post(registerUser);

// Method 2: define router together
userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
userRouter.post("/login", loginUser);

//Secured Route
userRouter.post("/logout", verifyJwt, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);
userRouter.post("/change-password", verifyJwt, changeCurrentPassword);

userRouter.get("/user-details", verifyJwt, getCurrentUser);

userRouter.put("/update-account", verifyJwt, updateAccountUser);
userRouter.patch(
  "/update-avatar",
  verifyJwt,
  upload.single("avatar"),
  updateUserAvatar
);
userRouter.patch(
  "/cover-image",
  verifyJwt,
  upload.single("coverImage"),
  updateUserCoverImage
);

export default userRouter;
