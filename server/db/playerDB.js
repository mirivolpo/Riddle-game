
import fs from "node:fs";

const DB_PATH = new URL("./players.txt", import.meta.url);

export async function loadPlayers() {
    const data = await fs.promises.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
}

export async function savePlayers(players) {
    const data = JSON.stringify(players, null, 2);
    await fs.promises.writeFile(DB_PATH, data, "utf8");
}
