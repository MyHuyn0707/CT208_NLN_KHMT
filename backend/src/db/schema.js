import {
    pgTable,
    uuid,
    text,
    boolean,
    jsonb,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role_enum", ["user", "moderator", "admin"]);
export const statusEnum = pgEnum("status_enum", ["active", "banned"]);

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").unique(),
    email: text("email").unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    role: roleEnum("role").notNull().default("user"),
    status: statusEnum("status").notNull().default("active"),
    publicMetadata: jsonb("public_metadata").notNull().default({}),
    privateMetadata: jsonb("private_metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// (quan hệ để mở rộng về sau; hiện chưa dùng)
export const usersRelations = relations(users, ({}) => ({}));
