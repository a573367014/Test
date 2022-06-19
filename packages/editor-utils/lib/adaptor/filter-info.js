"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFilterIntensity = getFilterIntensity;
exports.setFilterIntensity = setFilterIntensity;

function getFilterIntensity(filterInfo) {
  if (!filterInfo) {
    return 0.8;
  }

  return typeof filterInfo.intensity === 'number' ? filterInfo.intensity : filterInfo.strong || 0;
}

function setFilterIntensity(intensity, filterInfo) {
  filterInfo.intensity = intensity;
  filterInfo.strong = intensity;
}