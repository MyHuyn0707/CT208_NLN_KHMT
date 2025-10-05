import { Router, json } from "express";
import { handleClerkWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// Sử dụng json middleware với verify function để có raw body cho webhook
router.post("/clerk", 
    json({
        verify: (req, res, buf) => {
            req.rawBody = buf.toString();
        }
    }), 
    handleClerkWebhook
);

export default router;