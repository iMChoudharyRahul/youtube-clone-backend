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
userRouter.post("/logout", refreshAccessToken);

export default userRouter;
