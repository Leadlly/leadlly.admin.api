import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import {  allocateStudents, deallocateStudents} from "../controllers/Student";

const router = express.Router();

router.post("/allocate-student/:mentorId", checkAuth, allocateStudents)
router.post("/deallocate-student", checkAuth, deallocateStudents)

export default router;
