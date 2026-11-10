
import fs from "node:fs";

const DB_PATH = "./riddles/db.txt";

export function loadRiddles() {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
}

export function saveRiddles(riddles) {
    const data = JSON.stringify(riddles, null, 2);
    fs.writeFileSync(DB_PATH, data, "utf8");
}