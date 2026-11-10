import fs from "node:fs";

const DB_PATH = new URL("./riddles.txt", import.meta.url);

export async function loadRiddles() {
    const data = await fs.promises.readFile(DB_PATH, "utf8");
    return JSON.parse(data);
}

export async function saveRiddles(riddles) {
    const data = JSON.stringify(riddles, null, 2);
    await fs.promises.writeFile(DB_PATH, data, "utf8");
}