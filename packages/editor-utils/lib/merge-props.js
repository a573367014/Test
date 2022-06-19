"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeProps = mergeProps;

function mergeProps(objValue, srcValue) {
  if (typeof objValue === 'object' && srcValue === null) {
    return objValue;
  }
}