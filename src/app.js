import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routers/user.router.js";

// Create an instance of the Express application
const app = express();

/**
 * Page Not Found
 */
app.all("*", (req, res) => {
  res.status(404).send("<h3>Page Not Found </h3>");
});

// Enable Cross-Origin Resource Sharing (CORS) middleware between two different origin(fronted-backend)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // reflecting the request header
    credentials: true, // Allow credentials (e.g., cookies, HTTP authentication) to be sent with the cross-origin request
  })
);

// Use the cookie-parser middleware to handle cookies in the request
app.use(cookieParser());

// Middleware for handling JSON data in the request body
app.use(express.json({ limit: "16kb" }));

// Middleware for handling URL-encoded data (e.g., form data) in the request body
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleware to serve static files and assets from the "public" directory
app.use(express.static("public"));

app.use("/api/v1/users", userRouter);

export { app };
