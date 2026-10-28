import readline from "readline-sync";
class Riddle {
    constructor(id, name, taskDescription, correctAnswer, difficulty, timeLimit, hint) {
        this.id = id;
        this.name = name;
        this.taskDescription = taskDescription;
        this.correctAnswer = correctAnswer;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
        this.hint = hint;
    }

    ask() {
        let correct = false;
        let hintUsed = false;

        console.log(`Riddle ${this.id}: ${this.name}`);
        console.log(this.taskDescription);

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

            if (answer === this.correctAnswer) {
                console.log("Correct!");
                correct = true;
            } else {
                console.log("Incorrect. Try again.");
            }
        }

        return hintUsed;
    }
}

export default Riddle;