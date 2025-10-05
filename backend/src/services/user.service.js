import { db, schema } from "../config/db.js";
import { eq } from "drizzle-orm";

function extractFromClerk(cu) {
    const emailPrimary =
        cu?.primary_email_address?.email_address ??
        cu?.email_addresses?.[0]?.email_address ??
        null;

    const emailVerified = !!cu?.email_addresses?.find(
        (e) =>
            e.id === cu?.primary_email_address_id &&
            e?.verification?.status === "verified"
    );

    const name =
        [cu?.first_name, cu?.last_name].filter(Boolean).join(" ") ||
        cu?.username ||
        emailPrimary;

    return {
        clerkUserId: cu.id,
        email: emailPrimary,
        name,
        avatarUrl: cu?.image_url ?? null,
        emailVerified,
        publicMetadata: cu?.public_metadata ?? {},
        privateMetadata: cu?.private_metadata ?? {},
    };
}

export async function upsertUserFromClerk(cu) {
    const data = extractFromClerk(cu);

    await db
        .insert(schema.users)
        .values({
            clerkUserId: data.clerkUserId,
            email: data.email,
            name: data.name,
            avatarUrl: data.avatarUrl,
            emailVerified: data.emailVerified,
            publicMetadata: data.publicMetadata,
            privateMetadata: data.privateMetadata,
        })
        .onConflictDoUpdate({
            target: schema.users.clerkUserId,
            set: {
                email: data.email,
                name: data.name,
                avatarUrl: data.avatarUrl,
                emailVerified: data.emailVerified,
                publicMetadata: data.publicMetadata,
                privateMetadata: data.privateMetadata,
                updatedAt: new Date(),
            },
        });
}

export async function findByClerkId(clerkUserId) {
    const rows = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.clerkUserId, clerkUserId))
        .limit(1);
    return rows[0] ?? null;
}

export async function banUserByClerkId(clerkUserId) {
    await db
        .update(schema.users)
        .set({ status: "banned", deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.users.clerkUserId, clerkUserId));
}

/**
 * Cập nhật thông tin hồ sơ người dùng trong database
 * @param {string} clerkUserId - ID người dùng từ Clerk
 * @param {Object} data - Dữ liệu cập nhật (name, bio, ...)
 * @returns {Object|null} - Thông tin người dùng sau khi cập nhật hoặc null nếu không tìm thấy
 */

export async function updateUserProfile(clerkUserId, data) {
    // Lọc các giá trị undefined và null
    const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined && v !== null)
    );

    // Nếu không có dữ liệu hợp lệ để cập nhật
    if (Object.keys(filteredData).length === 0) {
        return await findByClerkId(clerkUserId);
    }

    // Thêm trường updatedAt
    filteredData.updatedAt = new Date();

    // Updating
    await db
        .update(schema.users)
        .set(filteredData)
        .where(eq(schema.users.clerkUserId, clerkUserId));

    // Lấy và trả về thông tin người dùng sau khi cập nhật
    return await findByClerkId(clerkUserId);
}
