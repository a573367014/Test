"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _zepto = _interopRequireDefault(require("./zepto"));

class EventEmitter {
  constructor() {
    this.$events = (0, _zepto.default)({});
  }

  get on() {
    return this.$events.on.bind(this.$events);
  }

  get once() {
    return this.$events.one.bind(this.$events);
  }

  get off() {
    return this.$events.off.bind(this.$events);
  }

  get emit() {
    return this.$events.trigger.bind(this.$events);
  }

}

exports.default = EventEmitter;