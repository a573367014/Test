// 暂不支持自定义文案
// const MATCH_PRICE = /^P[123](-\d)?$/;
const MATCH_PRICE = /^P[1234](-\d)?$/;

// 根据 category 判断当前元素是否是智能价签
export const isPriceTag = (category = '') => {
    return MATCH_PRICE.test(category);
};

// 获取价签类型
export const getPriceInfo = (category = '') => {
    const [type, index = '1'] = category.split('-');
    return { type, index };
};
