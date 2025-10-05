import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

// Bật CORS để frontend có thể gọi API
app.use(
    cors({
        origin: true, // Cho phép tất cả các origin trong quá trình phát triển
        credentials: true, // Cho phép gửi cookies
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// mount webhook (raw body) trước
app.use("/v1/webhooks", webhookRoutes);

// json parser cho các route còn lại
app.use(bodyParser.json());
app.use("/v1/auth", authRoutes);

// Health check endpoint
app.get("/health", (_req, res) => res.json({ ok: true }));

// Xử lý 404 - Route không tồn tại
app.use(notFoundHandler);

// Middleware xử lý lỗi chung
app.use(errorHandler);

export default app;
