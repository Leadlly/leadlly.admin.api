import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { getMentor, getMentorWithStudents, getStudentsWithNullMentor, verifyMentor } from "../controllers/Mentor";

const router = express.Router();

router.get("/getmentor", checkAuth, getMentor);
router.put("/verify/:id", checkAuth, verifyMentor)
router.get("/getstudent/:id", checkAuth, getMentorWithStudents)
router.get("/getmentorstudent", checkAuth, getStudentsWithNullMentor)

export default router;
