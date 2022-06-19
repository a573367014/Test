"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parserVoxType = parserVoxType;
exports.stringfiyVoxType = stringfiyVoxType;
const voxTypeMap = {
  default: 0,
  man: 1,
  robot: 2,
  canyonEcho: 3,
  fatNerd: 4,
  minions: 5,
  guanyin: 6,
  giantMan: 7
};
const voxTypeStringMap = {
  0: 'default',
  1: 'man',
  2: 'robot',
  3: 'canyonEcho',
  4: 'fatNerd',
  5: 'minions',
  6: 'guanyin',
  7: 'giantMan'
};

function parserVoxType(voxType) {
  if (typeof voxType === 'string') {
    voxType = voxTypeMap[voxType] || voxTypeMap.default;
  }

  return voxType;
}

function stringfiyVoxType(voxType) {
  if (typeof voxType === 'number') {
    voxType = voxTypeStringMap[voxType] || voxTypeStringMap[0];
  }

  return voxType;
}