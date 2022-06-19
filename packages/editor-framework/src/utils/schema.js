import { isNumber, isString } from 'lodash';

// 验证类型 对应默认值
const VALIDATE_TYPE = {
    isURL: 'isURL',
    isEnum: 'isEnum',
    isNumber: 'isNumber',
    isString: 'isString',
};

const defaultRule = {
    top: {
        rule: VALIDATE_TYPE.isNumber,
        default: 0,
    },
    left: {
        rule: VALIDATE_TYPE.isNumber,
        default: 0,
    },
    width: {
        rule: VALIDATE_TYPE.isNumber,
        default: 0,
    },
    height: {
        rule: VALIDATE_TYPE.isNumber,
        default: 0,
    },
};

const rule = {
    image: {
        ...defaultRule,
        url: {
            rule: VALIDATE_TYPE.isURL,
            default: 0,
        },
    },
    mask: {
        ...defaultRule,
        url: {
            rule: VALIDATE_TYPE.isURL,
            default: '',
        },
        mask: {
            rule: VALIDATE_TYPE.isURL,
            default: '',
        },
    },
    svg: {
        ...defaultRule,
    },
    text: {
        ...defaultRule,
        writingMode: {
            rule: VALIDATE_TYPE.isEnum,
            enum: ['horizontal-tb', 'vertical-rl', 'normal', null],
            default: 'normal',
        },
        fontStyle: {
            rule: VALIDATE_TYPE.isEnum,
            enum: ['normal', 'italic', 'oblique'],
            default: 'normal',
        },
        fontWeight: {
            rule: VALIDATE_TYPE.isNumber,
            default: 400,
        },
        textDecoration: {
            rule: VALIDATE_TYPE.isEnum,
            enum: ['underline', 'none', 'overline'],
            default: 'none',
        },
        fontSize: {
            rule: VALIDATE_TYPE.isNumber,
            default: 12,
        },
        lineHeight: {
            rule: VALIDATE_TYPE.isNumber,
            default: 1.2,
        },
    },
};

export default class SchemaModel {
    setModel(model) {
        this.model = model;
    }

    check() {
        const { type } = this.model;
        const modelRule = rule[type] || defaultRule;

        const unValidateList = [];

        Object.keys(this.model).forEach((key) => {
            const keyValidateRule = modelRule[key];
            if (keyValidateRule) {
                const { rule: ruleType, default: defaultValue, enum: enumArray } = keyValidateRule;

                if (this[ruleType + 'Check'] && !this[ruleType + 'Check'](key, enumArray)) {
                    unValidateList.push({
                        key,
                        default: defaultValue,
                    });
                }
            }
        });

        return unValidateList;
    }

    validateModify() {
        const unValidateList = this.check();

        unValidateList.forEach((validate) => {
            const { key, default: defaultValue } = validate;

            this.model[key] = defaultValue;
        });
    }

    isEnumCheck(key, enumArray = []) {
        return enumArray.includes(this.model[key]);
    }

    isNumberCheck(key) {
        return isNumber(this.model[key]);
    }

    isStringCheck(key) {
        return isString(this.model[key]);
    }

    isURLCheck(key) {
        // eslint-disable-next-line
        const regexp = new RegExp(
            '^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$',
            'i',
        );

        return regexp.test(this.model[key]);
    }
}
