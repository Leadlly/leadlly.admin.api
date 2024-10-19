import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { getMentor, getMentorWithStudents, verifyMentor } from "../controllers/Mentor";

const router = express.Router();

router.get("/getmentor",  getMentor);
router.put("/verify/:id", checkAuth, verifyMentor)
router.get("/getstudent/:id",  getMentorWithStudents)

export default router;
