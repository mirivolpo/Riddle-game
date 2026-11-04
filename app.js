
import readline from "readline-sync";
import { loadRiddles } from "./riddles/riddleDB.js";
import Riddle from "./classes/Riddle.js";
import Player from "./classes/Player.js";
import MultipleChoiceRiddle from "./classes/MultipleChoiceRiddle.js";

// Measure riddle solving time and apply penalties
function withTiming(func, player, timeLimit) {
    return function () {
        const start = Date.now();
        const hintUsed = func();
        const end = Date.now();

        const elapsed = end - start;
        let penalty = 0;

        if (elapsed > timeLimit * 1000) {
            console.log("Too slow! 5 seconds penalty applied.");
            penalty += 5000;
        }

        if (hintUsed) {
            console.log("Hint used! 10 seconds penalty applied.");
            penalty += 10000;
        }

        player.recordTime(start, end + penalty);
    };
}

// Ask the player to choose a valid difficulty
function chooseDifficulty(allRiddles) {
    let filteredRiddles = [];

    while (filteredRiddles.length === 0) {
        const level = readline.question(
            "Choose difficulty: easy / medium / hard: "
        );

        if (!["easy", "medium", "hard"].includes(level)) {
            console.log("Invalid difficulty. Try again.");
            continue;
        }

        filteredRiddles = allRiddles.filter(
            riddle => riddle.difficulty === level
        );

        if (filteredRiddles.length === 0) {
            console.log("No riddles available for this difficulty. Choose another.");
        }
    }

    return filteredRiddles;
}

// Create the appropriate riddle instance
function createRiddle(riddle) {
    if (riddle.choices) {
        return new MultipleChoiceRiddle(
            riddle.id,
            riddle.name,
            riddle.taskDescription,
            riddle.correctAnswer,
            riddle.choices,
            riddle.difficulty,
            riddle.timeLimit,
            riddle.hint
        );
    }

    return new Riddle(
        riddle.id,
        riddle.name,
        riddle.taskDescription,
        riddle.correctAnswer,
        riddle.difficulty,
        riddle.timeLimit,
        riddle.hint
    );
}

// Shuffle riddles using the Fisher-Yates algorithm
function shuffleRiddles(riddles) {
    const shuffled = [...riddles];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }

    return shuffled;
}

// Main game flow
function main() {
    console.log("Welcome to the Riddle Game!");

    const name = readline.question("What is your name? ");
    const player = new Player(name);

    const allRiddles = loadRiddles();
    const filteredRiddles = chooseDifficulty(allRiddles);
    const riddles = filteredRiddles.map(riddle => createRiddle(riddle));
    const shuffledRiddles = shuffleRiddles(riddles);

    for (const riddle of shuffledRiddles) {
        const timedAsk = withTiming(
            () => riddle.ask(),
            player,
            riddle.timeLimit
        );
        timedAsk();
    }

    console.log(`Great job, ${player.name}!`);
    player.showStats();
}

main();
