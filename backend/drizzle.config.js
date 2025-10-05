import { ENV } from "./src/config/env.js";
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default {
    schema: "./src/db/schema.js",
    out: "../backend/migrations",
    dialect: "postgresql",
    dbCredentials: { url: ENV.DATABASE_URL },
    strict: true,
};
