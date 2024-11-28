import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { getMentor, getMentorById, getMentorWithStudents, verifyMentor } from "../controllers/Mentor";

const router = express.Router();

router.get("/getmentor",  getMentor);
router.put("/verify/:id", checkAuth, verifyMentor)
router.get("/getMentor/:id", getMentorById)
router.get("/getstudent/:id",  getMentorWithStudents)

export default router;
