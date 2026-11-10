import express from "express";

import riddlesRouter from "./routes/riddles.js";
import playersRouter from "./routes/players.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Riddle Game Server is running!" });
});

app.use("/api/riddles", riddlesRouter);
app.use("/api/players", playersRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});