"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTransitionIn = getTransitionIn;
exports.getTransitionOut = getTransitionOut;
exports.setTransitionIn = setTransitionIn;
exports.setTransitionOut = setTransitionOut;

var _timeRange = require("./time-range");

var _getTransition = require("./utils/get-transition");

function getTransitionIn(element) {
  if (element.transitionIn) {
    return element.transitionIn;
  }

  if (element.animation && element.animation.enterTransition) {
    const enterTransition = (0, _getTransition.fixOldTransitionType)(element.animation.enterTransition);
    const option = (0, _getTransition.transitionTypeToOption)(enterTransition);
    const transition = (0, _getTransition.getTransition)(option);
    return {
      option,
      delay: transition.inOffset,
      duration: transition.inDuration
    };
  }

  return {
    option: 'none',
    delay: 0,
    duration: 0
  };
}

function setTransitionIn(transitionOption, element) {
  const transition = (0, _getTransition.getTransition)(transitionOption);

  if (transitionOption !== 'none') {
    element.transitionIn = {
      option: transitionOption,
      delay: transition.inOffset,
      duration: transition.inDuration
    };
  } else {
    element.transitionIn = null;
  }

  if (!element.animation) {
    element.animation = {
      animationEffects: []
    };
  }

  const transitionType = (0, _getTransition.transitionOptionToType)(transitionOption);
  element.animation.enterTransition = transitionType;
}

function getTransitionOut(element) {
  if (element.transitionOut) {
    return element.transitionOut;
  }

  if (element.animation && element.animation.leaveTransition) {
    const leaveTransition = (0, _getTransition.fixOldTransitionType)(element.animation.leaveTransition);
    const option = (0, _getTransition.transitionTypeToOption)(leaveTransition);
    const transition = (0, _getTransition.getTransition)(option);
    const {
      duration
    } = (0, _timeRange.getTimeRange)(element);
    return {
      option,
      delay: duration + transition.outOffset,
      duration: transition.outDuration
    };
  }

  return {
    option: 'none',
    delay: 0,
    duration: 0
  };
}

function setTransitionOut(transitionOption, element) {
  const transition = (0, _getTransition.getTransition)(transitionOption);
  const {
    duration
  } = (0, _timeRange.getTimeRange)(element);

  if (transitionOption !== 'none') {
    element.transitionOut = {
      option: transitionOption,
      delay: duration + transition.outOffset,
      duration: transition.outDuration
    };
  } else {
    element.transitionOut = null;
  }

  if (!element.animation) {
    element.animation = {
      animationEffects: []
    };
  }

  const transitionType = (0, _getTransition.transitionOptionToType)(transitionOption);
  element.animation.leaveTransition = transitionType;
}