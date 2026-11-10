import fs from "node:fs";

const DB_PATH = "./players/players.txt";

export function loadPlayers() {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
}

export function savePlayers(players) {
    const data = JSON.stringify(players, null, 2);
    fs.writeFileSync(DB_PATH, data, "utf8");
}