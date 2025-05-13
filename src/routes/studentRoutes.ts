import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { getStudentsWithNullMentor, allocateStudents, deallocateStudents} from "../controllers/Student";
import { importStudents } from "../controllers/StudentManagement";

const router = express.Router();

router.use(checkAuth)

router.post("/allocate-student/:mentorId", allocateStudents)
router.post("/deallocate-student", deallocateStudents)
router.get("/getmentorstudent", getStudentsWithNullMentor)
router.post("/add/:instituteId", importStudents)

export default router;
