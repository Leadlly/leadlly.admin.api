import express from "express";

import { checkAuth } from "../middleware/checkAuth";
import { getMentor, verifyMentor } from "../controllers/Mentor";

const router = express.Router();

router.get("/getmentor", checkAuth, getMentor);
router.put("/verify/:id", checkAuth, verifyMentor)

export default router;
