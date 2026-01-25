require("dotenv").config();

const cors = require("cors");
const express = require("express");
const { connectDB } = require("./config/database.js");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');



const userRoute = require("./routes/userRoute.js");
const courseRoute = require("./routes/courseRoute.js");
const reviewRoute = require("./routes/reviewRoute.js");
const cartRoute = require("./routes/cartRoute.js");
const wishlistRoute = require("./routes/wishlistRoute.js")
const categoryRoute = require("./routes/categoryRoute.js");
const AssignmentRoute = require("./routes/assignmentRoute.js");
const StudyPlanRoute = require("./routes/studyPlanRoute.js");
const stripeRoute = require('./routes/stripeRoute.js');
const authRoute = require("./routes/authRoute.js");

const app = express();
const port = process.env.PORT || 4500; // Ensure default value if PORT is not set

app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/stripeRoute.js")
);

// Connect to Database
connectDB();

// Basic route for testing connection
app.get('/', async (req, res) => { res.send('Connected'); });

// Middleware
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);



// ✅ Handle preflight OPTIONS requests for all routes
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Create a validation utility
// filepath: LearnLab-New/Backend/LearnLab-Backend/utils/validators.js

const mongoose = require('mongoose');

const validators = {
  isValidObjectId: (id) => mongoose.Types.ObjectId.isValid(id),
  
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isStrongPassword: (password) => {
    // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  },
  
  isValidPrice: (price) => {
    return !isNaN(price) && price >= 0 && Number.isFinite(price);
  },
  
  isValidEnum: (value, enumArray) => enumArray.includes(value),
};

module.exports = validators;

// Routes
app.use("/user", userRoute);
app.use("/courses", courseRoute);
app.use("/rating", reviewRoute);
app.use("/cart", cartRoute);
app.use("/wishlist", wishlistRoute)
app.use("/category", categoryRoute);
app.use("/assignment", AssignmentRoute);
app.use("/studyPlan", StudyPlanRoute);
app.use("/auth", authRoute);
app.use('/payment', stripeRoute);

// Listen on specified port
app.listen(port, () => {
  console.log(`App Listening on port ${port}`);
});

// Export app for Vercel compatibility
module.exports = app;
