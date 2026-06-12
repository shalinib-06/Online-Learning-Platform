const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  sendPasswordOtp,
  resetPasswordWithOtp,
  getLeaderboard,
} = require("../controllers/profileController");

const router = express.Router();
router.use(protect);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/password/send-otp", sendPasswordOtp);
router.patch("/password/reset", resetPasswordWithOtp);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
