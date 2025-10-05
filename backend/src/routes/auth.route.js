import { Router } from "express";
import { requireAuth, clerkMiddleware } from "../config/clerk.js";
import {
    getMe,
    verifyToken,
    updateProfile,
} from "../controllers/auth.controller.js";

const router = Router();

/**
 * @route GET /v1/auth/me
 * @description Lấy thông tin người dùng hiện tại
 * @access Private - Yêu cầu đăng nhập
 */

router.get("/me", requireAuth(), clerkMiddleware(), getMe);

/**
 * @route GET /v1/auth/verify-token
 * @description Kiểm tra tính hợp lệ của token
 * @access Private - Yêu cầu đăng nhập
 */
router.get("/verify-token", requireAuth(), clerkMiddleware(), verifyToken);

/**
 * @route PATCH /v1/auth/profile
 * @description Cập nhật thông tin hồ sơ người dùng
 * @access Private - Yêu cầu đăng nhập
 */
router.patch("/profile", requireAuth(), clerkMiddleware(), updateProfile);

export default router;
