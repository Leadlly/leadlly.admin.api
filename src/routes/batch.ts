import express from "express";
import { checkAuth } from "../middleware/checkAuth";
import { checkRole } from "../middleware/checkRole";
import {
  createBatch,
  getMentorBatches,
  getBatchDetails,
  updateBatch,
  regenerateShareCode
} from "../controllers/BatchManagement";

const router = express.Router();

// All routes are protected for teachers only
router.use(checkAuth, checkRole("admin"));

// Create new batch
router.post("/create", createBatch);

// Get all batches for mentor
router.get("/all", getMentorBatches);

// Get single batch details
router.get("/:id", getBatchDetails);

// Update batch
router.put("/:id", updateBatch);

// Regenerate share code
router.post("/:id/regenerate-code", regenerateShareCode);


export default router;