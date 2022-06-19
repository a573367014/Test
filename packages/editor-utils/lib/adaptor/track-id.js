"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTrackId = getTrackId;
exports.setTrackId = setTrackId;

function setTrackId(trackId, element) {
  element.trackId = trackId;
  element.trackerId = trackId;
}

function getTrackId(element) {
  return element.trackId || element.trackerId || '';
}