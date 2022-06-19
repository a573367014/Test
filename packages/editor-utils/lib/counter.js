"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.counter = void 0;

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

const counter = new Counter();
exports.counter = counter;