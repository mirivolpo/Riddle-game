
import readline from "readline-sync";
import { loadRiddles, saveRiddles } from "../server/db/riddleDB.js";
import Riddle from "./classes/Riddle.js";
import Player from "./classes/Player.js";
import { loadPlayers, savePlayers } from "../server/db/playerDB.js";
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

async function createNewRiddle() {
    const name = readline.question("Enter riddle name: ");
    const taskDescription = readline.question("Enter description: ");
    const correctAnswer = readline.question("Enter correct answer: ");

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


    try {
        const response = await fetch("http://localhost:3000/api/riddles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(riddleData)
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(`Failed to create riddle: ${data.message}`);
            return;
        }

        console.log(`Riddle created successfully! ID: ${data.id}`);

    } catch (error) {
        console.error("Error connecting to server:", error.message);
    }

}


async function findOrCreatePlayer(name) {
    try {
        const response = await fetch("http://localhost:3000/api/players", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Connection": "close"
            },
            body: JSON.stringify({ name })
        });

        const player = await response.json();

        if (!response.ok) {
            throw new Error(player.message || "Failed to find or create player");
        }

        return player;

    } catch (error) {
        console.error("Error finding or creating player:", error.message);
        return null;
    }
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


async function playGame() {
    console.log("Welcome to the Riddle Game!");

    const name = readline.question("What is your name? ");
    const player = new Player(name);

    const playerData = await findOrCreatePlayer(name);
    if (!playerData) {
        console.log("Unable to start game. Failed to load player.");
        return;
    }

    if (playerData.lowestTime !== null) {
        console.log(`Hi ${name}! Your previous lowest time was ${playerData.lowestTime} seconds.`);
    } else {
        console.log(`Welcome, ${name}! This is your first game.`);
    }

    let allRiddles;

    try {
        const response = await fetch("http://localhost:3000/api/riddles", {
            headers: {
                "Connection": "close"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load riddles");
        }

        allRiddles = await response.json();

    } catch (error) {
        console.error("Error loading riddles:", error.message);
        return;
    }

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
    await updatePlayerRecord(playerData.id, totalTime);
}

async function readAllRiddles() {

    try {
        const response = await fetch("http://localhost:3000/api/riddles");

        if (!response.ok) {
            throw new Error("Failed to load riddles");
        }

        const riddles = await response.json();

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

    } catch (error) {
        console.error("Error loading riddles:", error.message);
    }

}



async function updateRiddle() {
    try {
        const response = await fetch("http://localhost:3000/api/riddles");

        if (!response.ok) {
            throw new Error("Failed to load riddles");
        }

        const riddles = await response.json();

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

        // Save updated riddle


        const updateResponse = await fetch(`http://localhost:3000/api/riddles/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(riddle)
        });

        const data = await updateResponse.json();

        if (!updateResponse.ok) {
            console.log(`Failed to update riddle: ${data.message}`);
            return;
        }

        console.log("Riddle updated successfully!");
    } catch (error) {
        console.error("Error updating riddle:", error.message);
    }

}


async function deleteRiddle() {
    try {
        const response = await fetch("http://localhost:3000/api/riddles");

        if (!response.ok) {
            throw new Error("Failed to load riddles");
        }

        const riddles = await response.json();

        const id = Number(readline.question("Enter riddle ID to delete: "));

        const riddle = riddles.find(r => r.id === id);

        if (!riddle) {
            console.log("Riddle not found.");
            return;
        }

        console.log(`Riddle to delete: ${riddle.name}`);

        const confirmation = readline.question(
            "Are you sure you want to delete this riddle? (y/n): "
        ).trim().toLowerCase();

        if (confirmation !== "y") {
            console.log("Deletion cancelled.");
            return;
        }

        const deleteResponse = await fetch(
            `http://localhost:3000/api/riddles/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await deleteResponse.json();

        if (!deleteResponse.ok) {
            console.log(`Failed to delete riddle: ${data.message}`);
            return;
        }

        console.log(data.message);

    } catch (error) {
        console.error("Error deleting riddle:", error.message);
    }
}



async function updatePlayerRecord(playerId, totalTime) {
    try {
        const response = await fetch(
            `http://localhost:3000/api/players/${playerId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ totalTime })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.log(`Failed to update player record: ${data.message}`);
            return;
        }

        console.log(`Your best recorded time is ${data.lowestTime} seconds.`);

    } catch (error) {
        console.error("Error updating player record:", error);
        console.error("Cause:", error.cause);
    }
}

async function showLeaderboard() {

    let players;

    try {
        const response = await fetch("http://localhost:3000/api/players", {
            headers: {
                "Connection": "close"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load players");
        }

        players = await response.json();

    } catch (error) {
        console.error("Error loading leaderboard:", error.message);
        return;
    }


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


async function main() {
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
            await playGame();
            break;

        case "2":
            await createNewRiddle();
            break;
        case "3":
            await readAllRiddles();
            break;
        case "4":
            await updateRiddle();
            break;
        case "5":
            await deleteRiddle();
            break;
        case "6":
            await showLeaderboard();
            break;

        default:
            console.log("Invalid choice.");
    }
}

main();
