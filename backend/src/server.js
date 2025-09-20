import express from "express";
import { ENV } from "./config/env.js";
import { UniqueOnConstraintBuilder } from "drizzle-orm/gel-core";
import { favoritesTable } from "./db/schema.js";
import { db } from "./config/db.js";
import { eq, and } from "drizzle-orm";
import job from "./config/cron.js";

const app = express();
console.log(ENV.PORT);
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production") job.start();

app.use(express.json());

// Test Helloword
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
    });
});

// Get Favorite by UserId
app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const userFavorites = await db
            .select()
            .from(favoritesTable)
            .where(eq(favoritesTable.userId, userId));

        // console.log(userFavorites);

        res.status(200).json({
            message: "Favorites fetched successfully",
            userFavorites,
        });
    } catch (error) {
        console.log("Error fetching the favorites", error);
        res.status(500).json({ error: "Something went wrong in Internal" });
    }
});

// Create Favorite
app.post("/api/favorites", async (req, res) => {
    try {
        const { userId, recipeId, title, image, cookTime, servings } = req.body;

        if (!userId || !recipeId || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newFavorite = await db
            .insert(favoritesTable)
            .values({
                userId,
                recipeId,
                title,
                image,
                cookTime,
                servings,
            })
            .returning();

        res.status(201).json(newFavorite[0]);
    } catch (error) {
        console.log("Error adding Favorite");
        res.status(500).json({ error: "Something went wrong in Internal" });
    }
});

// Delete Favorite
app.delete("/api/favorites/:userId/:recipeId", async (req, res) => {
    try {
        const { userId, recipeId } = req.params;
        await db
            .delete(favoritesTable)
            .where(
                and(
                    eq(favoritesTable.userId, userId),
                    eq(favoritesTable.recipeId, parseInt(recipeId))
                )
            );

        res.status(200).json({ message: "Favorite deleted successfully" });
    } catch (error) {
        console.log("Error deleting Favorite", error);
        res.status(500).json({ error: "Something went wrong in Internal" });
    }
});

app.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT);
});
