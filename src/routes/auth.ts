import express from "express";
import {
  forgotPassword,
  getUser,
  login,
  logout,
  register,
  resetPassword,
} from "../controllers/Auth";
import { checkAuth } from "../middleware/checkAuth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", checkAuth, logout);
router.post("/forgetpassword", forgotPassword);
router.put("/resetpassword/:token", checkAuth, resetPassword);
router.get("/user", checkAuth, getUser);

export default router;
 