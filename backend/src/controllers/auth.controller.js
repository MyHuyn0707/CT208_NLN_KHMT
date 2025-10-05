import { clerkClient } from "../config/clerk.js";
import {
    findByClerkId,
    upsertUserFromClerk,
    updateUserProfile,
} from "../services/user.service.js";

/**
 * Kiểm tra tính hợp lệ của token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Thông tin về tính hợp lệ của token
 */

export async function verifyToken(req, res) {
    try {
        // Token hợp lệ nếu request đến được đây (đã vượt qua middleware requireAuth)
        const clerkUserId = req.auth().userId;

        // Kiểm tra xem user có tồn tại trong database không
        const user = await findByClerkId(clerkUserId);

        if (!user) {
            return res.status(404).json({
                valid: false,
                message: "User not found in database",
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                valid: false,
                message: "User account is not active",
            });
        }

        // Token hợp lệ và user tồn tại
        return res.json({
            valid: true,
            userId: user.id,
            clerkUserId: user.clerkUserId,
            role: user.role,
        });
    } catch (err) {
        console.error("verifyToken error:", err);
        return res.status(500).json({
            valid: false,
            message: "Error validating token",
            error: err.message,
        });
    }
}

export async function getMe(req, res) {
    try {
        const clerkUserId = req.auth().userId;

        let user = await findByClerkId(clerkUserId);

        if (!user) {
            const cu = await clerkClient.users.getUser(clerkUserId);
            await upsertUserFromClerk(cu);
            user = await findByClerkId(clerkUserId);
        }

        res.json({
            id: user.id,
            clerkUserId: user.clerkUserId,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role,
            status: user.status,
            publicMetadata: user.publicMetadata,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (err) {
        console.error("getMe error:", err);
        res.status(500).json({ error: "Internal error" });
    }
}

/**
 * Cập nhật thông tin hồ sơ người dùng
 * @param {Object} req - Express request object với body chứa thông tin cập nhật
 * @param {Object} res - Express response object
 * @returns {Object} - Thông tin người dùng sau khi cập nhật
 */

export async function updateProfile(req, res) {
    try {
        const clerkUserId = req.auth().userId;
        const { name, bio } = req.body;

        if (!name && !bio) {
            return res.status(400).json({
                error: "No update data provided. Please provide at least one field to update.",
            });
        }

        // Cập nhật thông tin trong database
        const updatedUser = await updateUserProfile(clerkUserId, { name, bio });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Cập nhật thông tin trên Clerk nếu có name
        if (name) {
            try {
                // Lấy thông tin hiện tại từ Clerk
                const clerkUser = await clerkClient.users.getUser(clerkUserId);
                const nameParts = name.split(" ");
                const firstName = nameParts[0] || "";
                const lastName =
                    nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

                // Cập nhật thông tin trên Clerk
                await clerkClient.users.updateUser(clerkUserId, {
                    firstName,
                    lastName,
                });
            } catch (clerkError) {
                console.error("Error updating Clerk profile:", clerkError);
                // Tiếp tục trả về thông tin từ database dù có lỗi từ Clerk
            }
        }

        // Trả về thông tin user đã cập nhật
        res.json({
            id: updatedUser.id,
            clerkUserId: updatedUser.clerkUserId,
            email: updatedUser.email,
            name: updatedUser.name,
            bio: updatedUser.bio,
            avatarUrl: updatedUser.avatarUrl,
            role: updatedUser.role,
            status: updatedUser.status,
            updatedAt: updatedUser.updatedAt,
        });
    } catch (err) {
        console.error("updateProfile error:", err);
        res.status(500).json({
            error: "Failed to update profile",
            message: err.message,
        });
    }
}
