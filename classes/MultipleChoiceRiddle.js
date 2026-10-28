import Riddle from "./Riddle.js";
import readline from "readline-sync";

class MultipleChoiceRiddle extends Riddle {

    constructor(id, name, taskDescription, correctAnswer, choices, difficulty, timeLimit, hint) {
        super(id, name, taskDescription, correctAnswer, difficulty, timeLimit, hint);
        this.choices = choices;
    }

    ask() {
        let correct = false;
        let hintUsed = false;

        console.log(`Riddle ${this.id}: ${this.name}`);
        console.log(this.taskDescription);
        console.log("Choices:");

        this.choices.forEach((choice, index) => {
            console.log(`${index + 1}. ${choice}`);
        });

        while (!correct) {
            const answer = readline.question("Enter your answer (or 'hint'): ");

            if (answer.toLowerCase() === "hint") {
                if (!this.hint) {
                    console.log("No hint available.");
                } else if (hintUsed) {
                    console.log("Hint already shown.");
                } else {
                    console.log(`Hint: ${this.hint}`);
                    hintUsed = true;
                }
                continue;
            }

            if (this.choices[Number(answer) - 1] === this.correctAnswer) {
                console.log("Correct!");
                correct = true;
            } else {
                console.log("Incorrect. Try again.");
            }
        }

        return hintUsed;
    }
}

export default MultipleChoiceRiddle;