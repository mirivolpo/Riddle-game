import readline from "readline-sync";
import Riddle from "./classes/Riddle.js";
import Player from "./classes/Player.js";
import allRiddles from "./riddles/index.js";

// Decorator for measuring the time taken to solve a riddle
function withTiming(func, player) {
    return function () {
        const start = Date.now();
        func();
        const end = Date.now();
        player.recordTime(start, end);
    };
}

console.log("Welcome to the Riddle Game!");

const name = readline.question("What is your name? ");
const player = new Player(name);

const riddles = allRiddles.map(riddle => {
    return new Riddle(
        riddle.id,
        riddle.name,
        riddle.taskDescription,
        riddle.correctAnswer
    );
});

for (const riddle of riddles) {
    const timedAsk = withTiming(() => riddle.ask(), player);
    timedAsk();
}

console.log(`Great job, ${player.name}!`);
player.showStats();