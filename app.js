
import readline from "readline-sync";
import { loadRiddles, saveRiddles } from "./riddles/riddleDB.js";
import Riddle from "./classes/Riddle.js";
import Player from "./classes/Player.js";
import { loadPlayers, savePlayers } from "./players/playerDB.js";
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
function createRiddleInstance(riddle) {
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

function createNewRiddle() {
    const name = readline.question("Enter riddle name: ");
    const taskDescription = readline.question("Enter description: ");
    const correctAnswer = readline.question("Enter correct answer: ");
    const riddles = loadRiddles();
    const newId = riddles.reduce(
        (maxId, riddle) => Math.max(maxId, riddle.id),
        0
    ) + 1;

    let difficulty = readline.question(
        "Enter difficulty (easy / medium / hard): "
    );

    while (!["easy", "medium", "hard"].includes(difficulty)) {
        console.log("Invalid difficulty. Try again.");
        difficulty = readline.question(
            "Enter difficulty (easy / medium / hard): "
        );
    }

    let timeLimit = Number(
        readline.question("Enter time limit in seconds: ")
    );

    while (!Number.isInteger(timeLimit) || timeLimit <= 0) {
        console.log("Invalid time limit. Enter a positive integer.");
        timeLimit = Number(
            readline.question("Enter time limit in seconds: ")
        );
    }

    const hint = readline.question(
        "Enter a hint (press Enter to skip): "
    ).trim();

    let isMultipleChoice = readline.question(
        "Is this a multiple-choice riddle? (y/n): "
    ).trim().toLowerCase();

    while (!["y", "n"].includes(isMultipleChoice)) {
        console.log("Invalid choice. Enter y or n.");
        isMultipleChoice = readline.question(
            "Is this a multiple-choice riddle? (y/n): "
        ).trim().toLowerCase();
    }

    let choices;

    if (isMultipleChoice === "y") {
        let validChoices = false;

        while (!validChoices) {
            const input = readline.question(
                "Enter choices separated by commas: "
            );

            choices = input.split(",").map(choice => choice.trim());

            if (choices.length >= 2 &&
                choices.every(choice => choice !== "") &&
                choices.includes(correctAnswer)) {
                validChoices = true;
            } else {
                console.log("Enter at least two non-empty choices, including the correct answer.");
            }
        }
    }

    const riddleData = {
        id: newId,
        name,
        taskDescription,
        correctAnswer,
        difficulty,
        timeLimit
    };

    if (hint) {
        riddleData.hint = hint;
    }

    if (isMultipleChoice === "y") {
        riddleData.choices = choices;
    }

    const newRiddle = createRiddleInstance(riddleData);

    riddles.push(newRiddle);
    saveRiddles(riddles);

    console.log("Riddle created successfully!");
}

function findOrCreatePlayer(name) {
    const players = loadPlayers();

    let player = players.find(player => player.name === name);

    if (!player) {
        const newId = players.reduce(
            (maxId, player) => Math.max(maxId, player.id),
            0
        ) + 1;

        player = {
            id: newId,
            name: name,
            lowestTime: null
        };

        players.push(player);
        savePlayers(players);
    }

    return player;
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


function playGame() {
    console.log("Welcome to the Riddle Game!");

    const name = readline.question("What is your name? ");
    const player = new Player(name);

    const playerData = findOrCreatePlayer(name);

    if (playerData.lowestTime !== null) {
        console.log(`Hi ${name}! Your previous lowest time was ${playerData.lowestTime} seconds.`);
    } else {
        console.log(`Welcome, ${name}! This is your first game.`);
    }

    const allRiddles = loadRiddles();
    const filteredRiddles = chooseDifficulty(allRiddles);
    const riddles = filteredRiddles.map(riddle => createRiddleInstance(riddle));
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
    const totalTime = player.showStats();
    updatePlayerRecord(playerData.id, totalTime);
}

function readAllRiddles() {
    const riddles = loadRiddles();

    riddles.forEach(riddle => {
        console.log(`ID: ${riddle.id}`);
        console.log(`Name: ${riddle.name}`);
        console.log(`Description: ${riddle.taskDescription}`);
        console.log(`Correct Answer: ${riddle.correctAnswer}`);
        console.log(`Difficulty: ${riddle.difficulty}`);
        console.log(`Time Limit: ${riddle.timeLimit} seconds`);
        if (riddle.hint) {
            console.log(`Hint: ${riddle.hint}`);
        }

        if (riddle.choices) {
            console.log(`Choices: ${riddle.choices.join(", ")}`);
        }
        console.log("------------------------");
    });
}



function updateRiddle() {
    const riddles = loadRiddles();

    const id = Number(readline.question("Enter riddle ID to update: "));
    const riddle = riddles.find(riddle => riddle.id === id);

    if (!riddle) {
        console.log("Riddle not found.");
        return;
    }

    console.log(`Updating riddle: ${riddle.name}`);
    console.log("Press Enter to keep the current value.");

    // Update name
    const newName = readline.question(
        `Current name: ${riddle.name}\nEnter new name (press Enter to keep current): `
    ).trim();

    if (newName) {
        riddle.name = newName;
    }

    // Update description
    const newDescription = readline.question(
        `Current description: ${riddle.taskDescription}\nEnter new description (press Enter to keep current): `
    ).trim();

    if (newDescription) {
        riddle.taskDescription = newDescription;
    }

    // Update difficulty
    let newDifficulty = readline.question(
        `Current difficulty: ${riddle.difficulty}\nEnter new difficulty (easy / medium / hard, or Enter to keep): `
    ).trim().toLowerCase();

    while (newDifficulty &&
        !["easy", "medium", "hard"].includes(newDifficulty)) {
        console.log("Invalid difficulty.");
        newDifficulty = readline.question(
            "Enter easy / medium / hard (or Enter to keep): "
        ).trim().toLowerCase();
    }

    if (newDifficulty) {
        riddle.difficulty = newDifficulty;
    }

    // Update time limit
    let newTimeLimit = readline.question(
        `Current time limit: ${riddle.timeLimit} seconds\nEnter new time limit (or Enter to keep): `
    ).trim();

    while (newTimeLimit &&
        (!Number.isInteger(Number(newTimeLimit)) || Number(newTimeLimit) <= 0)) {
        console.log("Enter a positive integer.");
        newTimeLimit = readline.question(
            "Enter time limit (or Enter to keep): "
        ).trim();
    }

    if (newTimeLimit) {
        riddle.timeLimit = Number(newTimeLimit);
    }

    // Update hint
    const newHint = readline.question(
        `Current hint: ${riddle.hint || "none"}\nEnter new hint (or Enter to keep): `
    ).trim();

    if (newHint) {
        riddle.hint = newHint;
    }

    // Update choices for multiple-choice riddles
    if (Array.isArray(riddle.choices)) {
        let newChoices = readline.question(
            `Current choices: ${riddle.choices.join(", ")}\nEnter new choices separated by commas (or Enter to keep): `
        ).trim();

        while (newChoices) {
            const choices = newChoices.split(",").map(choice => choice.trim());

            if (choices.length >= 2 && choices.every(choice => choice !== "")) {
                riddle.choices = choices;
                break;
            }

            console.log("Enter at least two non-empty choices.");
            newChoices = readline.question(
                "Enter new choices separated by commas (or Enter to keep current): "
            ).trim();
        }
    }

    // Update correct answer
    let newAnswer = readline.question(
        `Current correct answer: ${riddle.correctAnswer}\nEnter new correct answer (or Enter to keep): `
    ).trim();

    if (newAnswer) {
        riddle.correctAnswer = newAnswer;
    }

    // Validate correct answer for multiple-choice riddles
    if (Array.isArray(riddle.choices)) {
        while (!riddle.choices.includes(riddle.correctAnswer)) {
            console.log("The correct answer must be one of the choices.");
            riddle.correctAnswer = readline.question(
                `Current choices: ${riddle.choices.join(", ")}\nEnter the correct answer: `
            ).trim();
        }
    }

    // Save updated riddles
    saveRiddles(riddles);
    console.log("Riddle updated successfully!");
}

function deleteRiddle() {
    const riddles = loadRiddles();

    const id = Number(
        readline.question("Enter riddle ID to delete: ")
    );

    const updatedRiddles = riddles.filter(
        riddle => riddle.id !== id
    );

    if (updatedRiddles.length === riddles.length) {
        console.log("Riddle not found.");
        return;
    }

    saveRiddles(updatedRiddles);
    console.log("Riddle deleted successfully!");
}

function updatePlayerRecord(playerId, totalTime) {
    const players = loadPlayers();

    const player = players.find(player => player.id === playerId);

    if (!player) {
        console.log("Player not found.");
        return;
    }

    if (player.lowestTime === null || totalTime < player.lowestTime) {
        player.lowestTime = totalTime;
        savePlayers(players);
        console.log("New record! Time updated.");
    } else {
        console.log("You did not beat your previous record.");
    }
}

function showLeaderboard() {
    const players = loadPlayers();

    const rankedPlayers = players.filter(
        player => player.lowestTime !== null
    );

    if (rankedPlayers.length === 0) {
        console.log("No player records available yet.");
        return;
    }

    rankedPlayers.sort((a, b) => a.lowestTime - b.lowestTime);

    console.log("\n🏆 Leaderboard:");

    rankedPlayers.forEach((player, index) => {
        console.log(`${index + 1}. ${player.name} - ${player.lowestTime.toFixed(2)} seconds`);
    });
}


function main() {
    console.log("\nWhat do you want to do?");
    console.log("1. Play the game");
    console.log("2. Create a new riddle");
    console.log("3. Read all riddles");
    console.log("4. Update an existing riddle");
    console.log("5. Delete a riddle");
    console.log("6. View leaderboard");

    const choice = readline.question("Enter your choice: ");

    switch (choice) {
        case "1":
            playGame();
            break;

        case "2":
            createNewRiddle();
            break;
        case "3":
            readAllRiddles();
            break;
        case "4":
            updateRiddle();
            break;
        case "5":
            deleteRiddle();
            break;
        case "6":
            showLeaderboard();
            break;

        default:
            console.log("Invalid choice.");
    }
}

main();
