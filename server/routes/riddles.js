import express from "express";
import { loadRiddles, saveRiddles } from "../db/riddleDB.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const riddles = await loadRiddles();
        res.json(riddles);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to load riddles"
        });
    }
});

router.post("/", async (req, res) => {

    const {
        name,
        taskDescription,
        correctAnswer,
        difficulty,
        timeLimit,
        hint,
        choices
    } = req.body || {};

    // Validate required fields
    if (
        typeof name !== "string" || !name.trim() ||
        typeof taskDescription !== "string" || !taskDescription.trim() ||
        typeof correctAnswer !== "string" || !correctAnswer.trim() ||
        !["easy", "medium", "hard"].includes(difficulty) ||
        !Number.isInteger(timeLimit) || timeLimit <= 0
    ) {
        return res.status(400).json({
            message: "Invalid riddle data"
        });
    }

    // Validate optional fields
    if (hint !== undefined &&
        (typeof hint !== "string" || !hint.trim())) {
        return res.status(400).json({
            message: "Invalid hint"
        });
    }

    if (choices !== undefined &&
        (!Array.isArray(choices) ||
            choices.length < 2 ||
            !choices.every(choice => typeof choice === "string" && choice.trim()) ||
            !choices.includes(correctAnswer))) {
        return res.status(400).json({
            message: "Invalid choices"
        });
    }

    try {
        const riddles = await loadRiddles();

        const newId = riddles.reduce(
            (maxId, riddle) => Math.max(maxId, riddle.id),
            0
        ) + 1;

        const newRiddle = {
            id: newId,
            name,
            taskDescription,
            correctAnswer,
            difficulty,
            timeLimit
        };

        if (hint !== undefined) {
            newRiddle.hint = hint;
        }

        if (choices !== undefined) {
            newRiddle.choices = choices;
        }

        riddles.push(newRiddle);
        await saveRiddles(riddles);

        return res.status(201).json(newRiddle);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to create riddle"
        });
    }
});



router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid riddle ID"
        });
    }

    const {
        name,
        taskDescription,
        correctAnswer,
        difficulty,
        timeLimit,
        hint,
        choices
    } = req.body || {};

    // Validate required fields
    if (
        typeof name !== "string" || !name.trim() ||
        typeof taskDescription !== "string" || !taskDescription.trim() ||
        typeof correctAnswer !== "string" || !correctAnswer.trim() ||
        !["easy", "medium", "hard"].includes(difficulty) ||
        !Number.isInteger(timeLimit) || timeLimit <= 0
    ) {
        return res.status(400).json({
            message: "Invalid riddle data"
        });
    }

    // Validate optional fields
    if (hint !== undefined &&
        (typeof hint !== "string" || !hint.trim())) {
        return res.status(400).json({
            message: "Invalid hint"
        });
    }

    if (choices !== undefined &&
        (!Array.isArray(choices) ||
            choices.length < 2 ||
            !choices.every(choice =>
                typeof choice === "string" && choice.trim()
            ) ||
            !choices.includes(correctAnswer))) {
        return res.status(400).json({
            message: "Invalid choices"
        });
    }

    try {
        const riddles = await loadRiddles();

        const index = riddles.findIndex(r => r.id === id);

        if (index === -1) {
            return res.status(404).json({
                message: "Riddle not found"
            });
        }

        const updatedRiddle = {
            id,
            name,
            taskDescription,
            correctAnswer,
            difficulty,
            timeLimit
        };

        if (hint !== undefined) {
            updatedRiddle.hint = hint;
        }

        if (choices !== undefined) {
            updatedRiddle.choices = choices;
        }

        riddles[index] = updatedRiddle;

        await saveRiddles(riddles);

        return res.json(updatedRiddle);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to update riddle"
        });
    }
});


router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            message: "Invalid riddle ID"
        });
    }

    try {
        const riddles = await loadRiddles();

        const updatedRiddles = riddles.filter(riddle => riddle.id !== id);

        if (updatedRiddles.length === riddles.length) {
            return res.status(404).json({
                message: "Riddle not found"
            });
        }

        await saveRiddles(updatedRiddles);

        return res.json({
            message: "Riddle deleted successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to delete riddle"
        });
    }
});

export default router;