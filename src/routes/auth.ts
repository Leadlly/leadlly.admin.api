import express from "express";
import {
  forgotPassword,
  getMentor,
  getUser,
  login,
  logout,
  register,
  resetPassword,
  verifyMentor,
} from "../controllers/Auth";
import { checkAuth } from "../middleware/checkAuth";

const router = express.Router();

router.post("/register", register);
// router.post("/verify", otpVerification);
// router.post("/resend", resentOtp);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgetpassword", forgotPassword);
router.put("/resetpassword/:token", resetPassword);
router.get("/user", checkAuth, getUser);
router.get("/mentor",  getMentor);
router.put("/verify/:id", verifyMentor)

export default router;
