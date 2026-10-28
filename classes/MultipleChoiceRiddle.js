import Riddle from "./Riddle.js";
import readline from "readline-sync";

class MultipleChoiceRiddle extends Riddle {

    constructor(id, name, taskDescription, correctAnswer, choices) {
        super(id, name, taskDescription, correctAnswer);
        this.choices = choices;
    }

    ask() {
        let correct = false;
        console.log(`Riddle ${this.id}: ${this.name}`);
        console.log(this.taskDescription);
        console.log("Choices:");
        this.choices.forEach((choice, index) => {
            console.log(`${index + 1}. ${choice}`);
        });
        while (!correct) {

            const answer = readline.question("Enter your answer: ");
            if (this.choices[Number(answer) - 1] === this.correctAnswer) {
                console.log("Correct!");
                correct = true;
            } else {
                console.log("Incorrect. Try again.");
            }
        }

    }

}

export default MultipleChoiceRiddle;