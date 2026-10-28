class Player {
    constructor(name) {
        this.name = name;
        this.times = [];
    }

    recordTime(start, end) {
        const time = end - start;
        this.times.push(time);
    }

    showStats() {
        const totalTime = this.times.reduce((sum, time) => sum + time, 0) / 1000;
        const avg = this.times.length > 0 ? totalTime / this.times.length : 0;

        console.log(`${this.name}'s stats:`);
        console.log(`Total time: ${totalTime.toFixed(2)} seconds`);
        console.log(`Average time: ${avg.toFixed(2)} seconds`);
    }
}
export default Player;