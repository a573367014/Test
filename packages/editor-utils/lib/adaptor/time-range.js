"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTimeRange = getTimeRange;
exports.setTimeRange = setTimeRange;

var _transition = require("./transition");

function getTimeRange(element) {
  if (element.timeRange) {
    return element.timeRange;
  }

  if (element.animation && element.animation.animationEffects[0] && element.animation.animationEffects[0].options) {
    const {
      delay,
      duration
    } = element.animation.animationEffects[0].options;
    return {
      delay,
      duration
    };
  }

  return {
    delay: 0,
    duration: 0
  };
}

function setTimeRange(delay, duration, element) {
  if (element.timeRange) {
    element.timeRange.delay = delay;
    element.timeRange.duration = duration;
  } else {
    element.timeRange = {
      delay,
      duration
    };
  }

  const transitionOut = (0, _transition.getTransitionOut)(element);

  if (transitionOut.option !== 'none') {
    (0, _transition.setTransitionOut)(transitionOut.option, element);
  }

  if (element.animation && element.animation.animationEffects[0]) {
    element.animation.animationEffects[0].options = {
      delay,
      duration
    };
    return;
  }

  element.animation = {
    animationEffects: [{
      options: {
        delay,
        duration
      }
    }]
  };
}