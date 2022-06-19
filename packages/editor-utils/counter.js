class Counter {
    constructor() {
        this.count = 0;
    }

    get() {
        const count = this.count;
        this.count += 1;
        return count;
    }
}

export const counter = new Counter();
