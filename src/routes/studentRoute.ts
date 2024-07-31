import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { updateStudentMentor, getStudentsWithNullMentor} from "../controllers/Student";

const router = express.Router();

router.post("/allocate-student/:studentId", checkAuth, updateStudentMentor)
router.get("/getmentorstudent", checkAuth, getStudentsWithNullMentor)

export default router;
