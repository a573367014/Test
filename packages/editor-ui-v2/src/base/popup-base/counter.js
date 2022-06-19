
export const counter = {
    count: 0,
    get() {
        this.count += 1;
        return this.count;
    }
};
