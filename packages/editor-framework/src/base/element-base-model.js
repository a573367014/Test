/**
 * ElementModel
 */

import { merge, cloneDeep } from 'lodash';
import transformMath from '@gaoding/editor-utils/transform-math';
import { uuid } from '@gaoding/editor-utils/string';
import { isGroup } from '@gaoding/editor-utils/element';

import { hexaToRgba, parseTransform } from '../utils/model-adaptation';
import defaultModel from './editor-defaults';

class ElementModel {
    constructor(data) {
        const type = data && data.type;

        if (!type) {
            throw new Error('No type to create model: ' + type);
        }

        merge(
            this,
            defaultModel.element,
            defaultModel.elementExts,
            defaultModel[type + 'Element'],
            data,
        );

        if (this.backgroundEffect && this.backgroundEffect.image) {
            this.backgroundEffect.image.transform = this.parseTransform(
                this.backgroundEffect.image.transform,
            );
        }

        if (this.backgroundColor) {
            this.backgroundColor = hexaToRgba(this.backgroundColor);
        }

        if (this.border) {
            this.border.color = hexaToRgba(this.border.color);
        }
        // clone parse transform
        this.transform = this.parseTransform(data.transform);

        if (this.boxShadow) {
            const shadow = this.boxShadow;

            shadow.color = hexaToRgba(shadow.color);
        }

        this.width = Number(this.width);
        this.height = Number(this.height);
        this.left = Number(this.left);
        this.top = Number(this.top);

        // 旧的错误数据兼容处理
        if (this.linkId === 0 || this.linkId === '0') {
            this.linkId = '';
        }

        // 奥德赛长页模板无效 category 置空
        if (typeof this.category === 'object') {
            this.category = '';
        }

        // id
        if (!this.$id) {
            this.$id = uuid();
        }

        if (!this.uuid) {
            this.uuid = uuid();
        }
    }

    // props
    get rotation() {
        return this.transform.rotation;
    }

    set rotation(rotation) {
        this.transform.rotation = rotation;
    }

    get rotate() {
        return transformMath.radToDeg(this.rotation);
    }

    set rotate(deg) {
        this.transform.rotation = transformMath.degToRad(deg);
    }

    get scaleX() {
        return this.transform.scale.x;
    }

    set scaleX(v) {
        this.transform.scale.x = v;
    }

    get scaleY() {
        return this.transform.scale.y;
    }

    set scaleY(v) {
        this.transform.scale.y = v;
    }

    get skewX() {
        return this.transform.skew.x;
    }

    set skewX(v) {
        this.transform.skew.x = v;
    }

    get skewY() {
        return this.transform.skew.y;
    }

    set skewY(v) {
        this.transform.skew.y = v;
    }

    parseTransform(matrixData) {
        return parseTransform(matrixData);
    }

    reset() {
        const id = this.$id;
        const parentId = this.$parentId;
        const cacheParentId = this.$cacheParentId;
        const tempGroupId = this.$tempGroupId;
        const renderId = this.$renderId;

        const extProps = cloneDeep(defaultModel.elementExts);

        merge(this, extProps);

        // restore id
        this.$id = id;
        this.$parentId = parentId;
        this.$cacheParentId = cacheParentId;
        this.$tempGroupId = tempGroupId;
        this.$renderId = renderId;
    }

    enableEditable() {
        this.rotatable = true;
        this.dragable = true;
        // this.resize = defaultModel[this.type + 'Element'] || 7;
    }

    disableEditable() {
        this.rotatable = false;
        this.dragable = false;
        // this.resize = 0;
    }

    toString() {
        return JSON.stringify(this);
    }

    clone(keepProps = ['$renderId']) {
        keepProps = keepProps || [];
        const keepPropsMap = keepProps.reduce((obj, name) => {
            obj[name] = true;
            return obj;
        }, {});

        const cloneElement = (element) => {
            if (isGroup(element)) {
                element.elements = element.elements.map((el) => {
                    return cloneElement(Object.assign({}, el));
                });
            }

            return Object.keys(element).reduce((elem, key) => {
                if ((key !== 'uuid' && !key.startsWith('$')) || keepPropsMap[key]) {
                    elem[key] = cloneDeep(element[key]);
                }
                return elem;
            }, {});
        };

        return cloneElement(Object.assign({}, this));
    }
}

export default ElementModel;
