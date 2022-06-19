"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkVersion = checkVersion;
exports.default = void 0;
exports.parse = parse;

function parse(version = '0.0.0') {
  const versions = String(version).split('.');

  while (versions.length < 3) {
    versions.push('0');
  }

  return new function Version(arr) {
    ['major', 'minor', 'patch'].forEach((key, i) => {
      this[key] = parseInt(arr[i], 10);
    });
    this._string = version;
    this._version = versions;
    this.number = versions.reduce((previous, current) => {
      previous += ('000' + current).substr(-3, 3);
      return parseInt(previous, 10);
    });
  }(versions);
}

function checkVersion(currentVersion, targetVersion) {
  currentVersion = parse(currentVersion);
  targetVersion = parse(targetVersion);

  if (currentVersion.major > targetVersion.major || currentVersion.major === targetVersion.major && currentVersion.minor > targetVersion.minor || currentVersion.major === targetVersion.major && currentVersion.minor === targetVersion.minor && currentVersion.patch >= targetVersion.patch) {
    return true;
  }

  return false;
}

var _default = {
  parse,
  checkVersion
};
exports.default = _default;