import express from "express";
import {
    signUp,
    login,
    updateProfile,
    changePassword,
    forgetPassword,
    resetPassword,
    getUser
}
    from "../controller/UserController.js";
import protect from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/signup", signUp)
router.post("/login", login)
router.get("/get-user/:userId", protect, getUser)
router.put("/update-profile/:userId", protect, updateProfile)
router.put("/change-password/:userId", protect, changePassword)
router.post("/forget-password", protect, forgetPassword)
router.post("/reset-password", protect, resetPassword)


export default router;