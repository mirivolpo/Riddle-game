import readline from "readline-sync";
class Riddle {
    constructor(id, name, taskDescription, correctAnswer, difficulty, timeLimit) {
        this.id = id;
        this.name = name;
        this.taskDescription = taskDescription;
        this.correctAnswer = correctAnswer;
        this.difficulty = difficulty;
        this.timeLimit = timeLimit;
    }

    ask() {
        let correct = false;
        console.log(`Riddle ${this.id}: ${this.name}`);
        console.log(this.taskDescription);
        while (!correct) {

            const answer = readline.question("Enter your answer: ");
            if (answer === this.correctAnswer) {
                console.log("Correct!");
                correct = true;
            } else {
                console.log("Incorrect. Try again.");
            }
        }

    }
}

export default Riddle;