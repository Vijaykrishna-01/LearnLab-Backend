const express = require("express");
const router = express.Router();
// const auth = require("../middleware/auth");
const { checkout } = require("../controllers/checkoutController");
const authMiddleware = require("../middleware/authMiddleware");
const { addToWishlist, removeFromWishlist, getWishlist } = require("../controllers/wishlistController");


// const { checkout } = require("../controllers/checkoutController");

router.post("/add/:courseId", authMiddleware, addToWishlist );
router.delete("/remove/:courseId", authMiddleware,  removeFromWishlist);
router.get("/",authMiddleware,  getWishlist);
router.post("/checkout",  checkout);

module.exports = router;
