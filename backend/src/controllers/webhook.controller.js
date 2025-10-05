import { Webhook } from "../config/clerk.js";
import { ENV } from "../config/env.js";
import {
    upsertUserFromClerk,
    banUserByClerkId,
} from "../services/user.service.js";

/**
 * Xử lý webhook từ Clerk để đồng bộ thông tin người dùng
 *
 * Webhook này nhận các sự kiện từ Clerk và thực hiện các thao tác tương ứng:
 * - user.created: Tạo người dùng mới trong database
 * - user.updated: Cập nhật thông tin người dùng trong database
 * - user.deleted: Đánh dấu người dùng đã bị xóa trong database (soft delete)
 *
 * @param {Object} req - Express request object chứa webhook payload và headers
 * @param {Object} res - Express response object
 * @returns {Object} - Kết quả xử lý webhook
 */

export async function handleClerkWebhook(req, res) {
    // 1. Kiểm tra và xác thực webhook signature
    const rawSecret = ENV.CLERK_WEBHOOK_SECRET;
    const webhookSecret =
        typeof rawSecret === "string"
            ? rawSecret.valueOf().trim()
            : String(rawSecret ?? "")
                  .valueOf()
                  .trim();
    console.log(
        "ENV.CLERK_WEBHOOK_SECRET:",
        ENV.CLERK_WEBHOOK_SECRET,
        typeof ENV.CLERK_WEBHOOK_SECRET
    );

    if (!webhookSecret) {
        console.error("Webhook secret not configured");
        return res.status(500).json({
            error: "Server misconfiguration",
            detail: "Webhook secret not configured",
        });
    }

    // 2. Xác thực signature từ Clerk

    // Lấy các header cần thiết  (Clerk gửi qua Svix)
    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");

    // Kiểm tra các header có tồn tại không
    if (!svixId || !svixTimestamp || !svixSignature) {
        return res.status(400).json({
            error: "Missing webhook headers",
            detail: "Required Svix headers are missing",
            missingHeaders: {
                svixId: !svixId,
                svixTimestamp: !svixTimestamp,
                svixSignature: !svixSignature,
            },
        });
    }
    let evt;
    try {
        const wh = new Webhook(webhookSecret);
        // Xác thực webhook
        evt = wh.verify(req.rawBody, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });
    } catch (verificationError) {
        console.error("Webhook verification failed:", verificationError);
        return res.status(400).json({
            error: "Invalid webhook signature",
            detail: "Could not verify the webhook signature",
            message: verificationError.message,
        });
    }

    // 3. Trích xuất thông tin từ event
    const { type, data } = evt;

    // Ghi log sự kiện nhận được (loại bỏ thông tin nhạy cảm)
    console.log(`Processing webhook event type: ${type}, user: ${data?.id}`);

    // 4. Xử lý event tương ứng với loại sự kiện
    try {
        switch (type) {
            case "user.created":
                console.log(`Creating new user: ${data.id}`);
                await upsertUserFromClerk(data);
                break;

            case "user.updated":
                console.log(`Updating user: ${data.id}`);
                await upsertUserFromClerk(data);
                break;

            case "user.deleted":
                console.log(`Soft deleting user: ${data.id}`);
                await banUserByClerkId(data.id);
                break;

            default:
                // Các sự kiện khác không được xử lý
                console.log(`Unhandled event type: ${type}`);
                return res.json({
                    ok: true,
                    message: `Event type '${type}' not handled`,
                });
        }
        res.json({
            ok: true,
            message: `Successfully processed ${type} event for user ${data.id}`,
        });
    } catch (err) {
        // 5. Xử lý lỗi chi tiết
        console.error(`Webhook handling failed for event ${type}:`, err);

        let statusCode = 500;
        let errorDetail = "Internal server error";

        if (err.code === "23505") {
            // PostgreSQL unique violation
            statusCode = 409;
            errorDetail = "Conflict with existing data";
        } else if (err.code === "23502") {
            // PostgreSQL not null violation
            statusCode = 400;
            errorDetail = "Missing required data";
        }

        res.status(statusCode).json({
            error: "Webhook processing error",
            detail: errorDetail,
            eventType: type,
            message: err.message,
        });
    }
}
