const express = require("express");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  submitCourse,
  getCategories,
} = require("../controllers/courseController");

const router = express.Router();

// Public/optional routes
router.get("/", optionalAuth, getCourses);
router.get("/categories", optionalAuth, getCategories);

// Specific routes BEFORE generic :id routes
router.get("/my", protect, authorize("instructor"), getCourses);
router.get("/:id", optionalAuth, getCourseById);

// Protected routes for modifications
router.use(protect);
router.post("/", authorize("instructor"), createCourse);
router.put("/:id", authorize("instructor", "admin"), updateCourse);
router.delete("/:id", authorize("instructor", "admin"), deleteCourse);
router.post("/:id/submit", authorize("instructor"), submitCourse);

module.exports = router;
