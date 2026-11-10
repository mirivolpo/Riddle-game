
import express from "express";
import { loadPlayers, savePlayers } from "../db/playerDB.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const players = await loadPlayers();
        res.json(players);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to load players"
        });
    }
});


router.post("/", async (req, res) => {
    const { name } = req.body || {};

    if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            message: "Invalid player name"
        });
    }

    const playerName = name.trim();

    try {
        const players = await loadPlayers();

        const existingPlayer = players.find(
            player => player.name === playerName
        );

        if (existingPlayer) {
            return res.status(200).json(existingPlayer);
        }

        const newId = players.reduce(
            (maxId, player) => Math.max(maxId, player.id),
            0
        ) + 1;

        const newPlayer = {
            id: newId,
            name: playerName,
            lowestTime: null
        };

        players.push(newPlayer);
        await savePlayers(players);

        return res.status(201).json(newPlayer);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to create player"
        });
    }
});


router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { totalTime } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid player ID"
        });
    }

    if (typeof totalTime !== "number" ||
        !Number.isFinite(totalTime) ||
        totalTime < 0) {
        return res.status(400).json({
            message: "Invalid total time"
        });
    }

    try {
        const players = await loadPlayers();

        const player = players.find(p => p.id === id);

        if (!player) {
            return res.status(404).json({
                message: "Player not found"
            });
        }

        if (player.lowestTime === null ||
            totalTime < player.lowestTime) {

            player.lowestTime = totalTime;
            await savePlayers(players);
        }

        return res.json(player);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to update player record"
        });
    }
});



export default router;
