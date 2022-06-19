"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPriceTag = exports.getPriceInfo = void 0;
const MATCH_PRICE = /^P[1234](-\d)?$/;

const isPriceTag = (category = '') => {
  return MATCH_PRICE.test(category);
};

exports.isPriceTag = isPriceTag;

const getPriceInfo = (category = '') => {
  const [type, index = '1'] = category.split('-');
  return {
    type,
    index
  };
};

exports.getPriceInfo = getPriceInfo;