import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { checkRole } from "../../middlewares/checkRole";
import {
  createBatch,
  getMentorBatches,
  getBatchDetails,
  updateBatch,
  deleteBatch,
  regenerateShareCode
} from "../../controllers/Admins/BatchManagement";
import { createBatchWork, submitBatchWork } from "../../controllers/Class/work";

const router = express.Router();

// All routes are protected for teachers only
router.use(checkAuth, checkRole(['teacher']));

// Create new batch
router.post("/create", createBatch);

// Get all batches for mentor
router.get("/all", getMentorBatches);

// Get single batch details
router.get("/:id", getBatchDetails);

// Update batch
router.put("/:id", updateBatch);

// Delete batch
router.delete("/:id", deleteBatch);

// Regenerate share code
router.post("/:id/regenerate-code", regenerateShareCode);

// Teacher routes (protected by role)
router.post("/create", createBatchWork);

// Student routes
router.post("/submit/:workId", checkAuth, submitBatchWork);

export default router;