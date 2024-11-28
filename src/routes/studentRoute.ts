import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { getStudentsWithNullMentor, allocateStudents, deallocateStudents, getStudent, getStudentById} from "../controllers/Student";

const router = express.Router();

router.get("/getstudents", getStudent)
router.get("/getstudent/:id", getStudentById)
router.post("/allocate-student/:mentorId",  allocateStudents)
router.post("/deallocate-student", deallocateStudents)
router.get("/getmentorstudent",  getStudentsWithNullMentor)

export default router;
