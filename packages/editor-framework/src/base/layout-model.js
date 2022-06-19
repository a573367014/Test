/**
 * ElementModel
 */

import { merge, cloneDeep, isUndefined, isNull, get, set, isEqual, pick, omit } from 'lodash';
import { uuid } from '@gaoding/editor-utils/string';

import { hexaToRgba } from '../utils/model-adaptation';
import editorDefaults from './editor-defaults';
import { parseTransform } from '@gaoding/editor-utils/transform';

const deprecatedProps = [
    'filter',
    'filterInfo',
    'backgroundColor',
    'backgroundImage',
    'backgroundImageInfo',
    'backgroundGradient',
    'backgroundWatermarkEnable',
    'backgroundRepeat',
];
const layoutDefault = omit(editorDefaults.layout, deprecatedProps);

/**
 * 转换背景数据(旧格式转成新格式)
 */
export function converPropsBackground(props, background) {
    if (
        !(
            props.backgroundColor ||
            props.backgroundImage ||
            props.backgroundImageInfo ||
            props.backgroundGradient ||
            props.backgroundWatermarkEnable
        ) ||
        props.background
    ) {
        return props;
    }

    props = { ...props };
    if (props.backgroundColor !== undefined) {
        set(props, 'background.color', props.backgroundColor);
        delete props.backgroundColor;
    }
    if (props.backgroundImage !== undefined) {
        set(props, 'background.image.url', props.backgroundImage);
        delete props.backgroundImage;
    }
    if (props.backgroundImageInfo !== undefined) {
        set(props, 'background.image.naturalWidth', props.backgroundImageInfo.width);
        set(props, 'background.image.naturalHeight', props.backgroundImageInfo.height);
        set(props, 'background.image.imageTransform', props.backgroundImageInfo.transform);
        set(props, 'background.image.opacity', props.backgroundImageInfo.opacity);
        delete props.backgroundImageInfo;
    }
    if (props.backgroundGradient !== undefined) {
        set(props, 'background.gradient', props.backgroundGradient);
        delete props.backgroundGradient;
    }
    if (props.backgroundWatermarkEnable !== undefined) {
        set(props, 'background.watermarkEnable', props.backgroundWatermarkEnable);
        delete props.backgroundWatermarkEnable;
    }

    if (props.background) {
        background = merge({}, background, props.background);
        props.background = background;
    }

    for (const key of deprecatedProps) {
        delete props[key];
    }
    return props;
}
export function convertModelBackground(model) {
    if (model.background?.image || model.background?.gradient) return model;

    const image = model.backgroundImageInfo && {
        ...model.backgroundImageInfo,
        url: model.backgroundImage,
        width: model.width,
        height: model.height,
        left: 0,
        top: 0,
        naturalWidth: model.backgroundImageInfo.width,
        naturalHeight: model.backgroundImageInfo.height,
        imageTransform: model.backgroundImageInfo.transform,
        transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
        repeat: model.backgroundRepeat,
        opacity: get(model, 'backgroundImageInfo.opacity', 1),
        filterInfo: model.filterInfo || null,
        filter: model.filter || null,
    };

    const background = {
        color: model.background?.color || model.backgroundColor,
    };

    if (model.backgroundGradient) {
        background.gradient = model.backgroundGradient;
    }

    if (image) {
        background.image = image;
    }

    background.watermarkEnable = !!model.backgroundWatermarkEnable;
    model.background = cloneDeep(background);

    for (const key of deprecatedProps) {
        delete model[key];
    }

    return model;
}

// 将为 null 的属性，替换为默认值
export const resetLayoutProps = (layout) => {
    convertModelBackground(layout);

    if (get(layout, 'background.image')) {
        const image = layout.background.image;
        if (!image.width) set(image, 'width', layout.width);
        if (!image.height) set(image, 'height', layout.height);
        if (image.opacity === undefined) set(image, 'opacity', 1);
        !image.imageTransform?.localTransform &&
            set(layout, 'background.image.imageTransform', parseTransform(image.imageTransform));
        !image.transform?.localTransform &&
            set(layout, 'background.image.transform', parseTransform(image.transform));
    }

    const defaultLayout = Object.assign(cloneDeep(layoutDefault), {
        border: { ...editorDefaults.border },
    });

    Object.keys(defaultLayout).forEach((key) => {
        const layoutValue = layout[key];

        if (isUndefined(layoutValue) || isNull(layoutValue)) {
            layout[key] = defaultLayout[key];
        }
    });

    set(layout, 'background.color', hexaToRgba(get(layout, 'background.color', 'rgba(0,0,0,0)')));

    if (
        layout.background?.image &&
        !layout.background.image.url &&
        !layout.background.image.elementRefIds?.length
    ) {
        layout.background.image = null;
    }

    return layout;
};

class LayoutModel {
    constructor(data, editor) {
        const newData = resetLayoutProps({ ...data });
        merge(this, layoutDefault, { border: { ...editorDefaults.border } }, newData);
        this.top = 0;

        if (!this.$id) {
            this.$id = uuid();
        }

        if (!this.uuid) {
            this.uuid = uuid();
        }

        const elements = this.elements || this.elems || [];

        if (elements && elements.length && editor) {
            this.elements = elements
                .filter((item) => item && item.type)
                .map((props) => {
                    const element = editor.createElement(props);
                    element.$parentId = this.uuid;
                    return element;
                });
        } else {
            this.elements = [];
        }

        if (this.mosaic && this.mosaic.paths && editor) {
            this.mosaic.paths = this.mosaic.paths.map((path) => editor.createElement(path));
        }

        // 兼容旧边框数据
        if (this.borderType) {
            this.border = Object.assign(this.border, {
                type: this.borderType,
                width: this.borderWidth,
                image: this.borderImage,
                imageSlice: this.borderImageSlice,
                opacity: this.borderOpacity,
                imageRepeat: this.borderImageRepeat,
            });
        }

        get(this, 'background.gradient.stops', []).forEach((stopPoint) => {
            stopPoint.color = hexaToRgba(stopPoint.color);
        });

        if (this.border) {
            this.border.color = hexaToRgba(this.border.color);
            this.border.gradient &&
                this.border.gradient.stops &&
                this.border.gradient.stops.forEach((stopPoint) => {
                    stopPoint.color = hexaToRgba(stopPoint.color);
                });

            if (this.border.type === 'image' && !this.border.image) {
                this.border.enable = false;
            }
        }

        if (this.backgroundMask) {
            this.backgroundMask.color = hexaToRgba(this.backgroundMask.color);
        }

        if (this.mosaic) {
            this.mosaic.color = hexaToRgba(this.mosaic.color);
        }

        if (data.backgroundSize && this.$backgroundImageInfo) {
            this.$imageWidth = data.backgroundSize[0];
            this.$imageHeight = data.backgroundSize[1];

            this.$imageLeft = this.$backgroundImageInfo.imageTransform.position.x;
            this.$imageTop = this.$backgroundImageInfo.imageTransform.position.y;
        }

        if (this.background.image && /data:image\/gif|\.gif/i.test(this.background.image.url)) {
            set(this, 'background.image.resourceType', 'gif');
        }

        delete this.backgroundSize;
        delete this.elems;
        delete this.backgroundPosition;
        delete this.borderType;
        delete this.borderWidth;
        delete this.borderImage;
        delete this.borderImageSlice;
        delete this.borderOpacity;
        delete this.borderColor;
        delete this.borderGradient;
        delete this.borderShadow;
    }

    exportData() {
        const mosaic = this.mosaic;
        const cloneLayout = { ...this };

        if (isEqual(mosaic, layoutDefault.mosaic)) {
            cloneLayout.mosaic = null;
        } else {
            const paths = mosaic.paths.map((path) => {
                const cloneTransform = path.parseTransform(path.transform);
                cloneTransform.position.x = path.left;
                cloneTransform.position.y = path.top;

                const newPath = pick(path, ['path', 'type']);
                newPath.transform = cloneTransform;
                if (path.type === 'mosaicBrush') {
                    newPath.strokeWidth = path.strokeWidth;
                }
                return newPath;
            });

            cloneLayout.mosaic = {
                ...mosaic,
                paths,
            };
        }

        if (
            isEqual(omit(cloneLayout.border, ['$loaded']), omit(editorDefaults.border, ['$loaded']))
        ) {
            cloneLayout.border = null;
        }

        // 导出时仍需兼容旧数据
        if (cloneLayout.background) {
            const image = cloneLayout.background.image;
            cloneLayout.backgroundColor = cloneLayout.background.color;

            if (image) {
                cloneLayout.backgroundImage = image.url;
                cloneLayout.backgroundImageInfo = {
                    transform: image.imageTransform,
                    width: image.naturalWidth,
                    height: image.naturalHeight,
                    opacity: image.opacity,
                };
            }

            cloneLayout.backgroundGradient = cloneLayout.background.gradient;
            cloneLayout.backgroundWatermarkEnable = !!cloneLayout.background.watermarkEnable;
        }
        return cloneLayout;
    }

    get $backgroundImageInfo() {
        return get(this.background, 'image');
    }

    get $backgroundImage() {
        return get(this.background, 'image.url');
    }

    get $imageWidth() {
        if (!this.$backgroundImageInfo) return 0;
        return Math.abs(
            this.$backgroundImageInfo.naturalWidth *
                this.$backgroundImageInfo.imageTransform.scale.x,
        );
    }

    set $imageWidth(v) {
        if (!this.$backgroundImageInfo) return;
        const imageTransform = this.$backgroundImageInfo.imageTransform;
        const baseNum = imageTransform.scale.x < 0 ? -1 : 1;
        imageTransform.scale.x = (v / this.$backgroundImageInfo.naturalWidth) * baseNum;
    }

    get $imageHeight() {
        if (!this.$backgroundImageInfo) return 0;
        return Math.abs(
            this.$backgroundImageInfo.naturalHeight *
                this.$backgroundImageInfo.imageTransform.scale.y,
        );
    }

    set $imageHeight(v) {
        if (!this.$backgroundImageInfo) return;
        const imageTransform = this.$backgroundImageInfo.imageTransform;
        const baseNum = imageTransform.scale.y < 0 ? -1 : 1;

        imageTransform.scale.y = (v / this.$backgroundImageInfo.naturalHeight) * baseNum;
    }

    get $imageLeft() {
        if (!this.$backgroundImageInfo) return 0;
        const {
            $backgroundImageInfo: {
                width,
                imageTransform: { position },
            },
            $imageWidth,
        } = this;

        return width / 2 - $imageWidth / 2 + position.x;
    }

    set $imageLeft(v) {
        if (!this.$backgroundImageInfo) return;
        this.$backgroundImageInfo.imageTransform.position.x =
            v + this.$imageWidth / 2 - this.$backgroundImageInfo.width / 2;
    }

    get $imageTop() {
        if (!this.$backgroundImageInfo) return 0;
        const {
            $backgroundImageInfo: {
                height,
                imageTransform: { position },
            },
            $imageHeight,
        } = this;

        return height / 2 - $imageHeight / 2 + position.y;
    }

    set $imageTop(v) {
        if (!this.$backgroundImageInfo) return;
        this.$backgroundImageInfo.imageTransform.position.y =
            v + this.$imageHeight / 2 - this.$backgroundImageInfo.height / 2;
    }

    get hasComplexFilters() {
        const { filterInfo } = this.$backgroundImageInfo || {};
        return filterInfo && (filterInfo.url || filterInfo.prunedZipUrl);
    }

    get hasBaseFilters() {
        const { filter } = this.$backgroundImageInfo || {};
        const defaultFilter = editorDefaults.element.filter;

        if (!filter) return false;
        return Object.keys(filter).some((key) => filter[key] !== defaultFilter[key]);
    }

    get hasFilters() {
        return this.hasBaseFilters || this.hasComplexFilters;
    }

    get isGif() {
        return get(this, 'background.image.resourceType') === 'gif';
    }

    get isApng() {
        return get(this, 'background.image.resourceType') === 'apng';
    }

    // TODO: 旧数据兼容
    get filter() {
        return this.background?.image?.filter;
    }

    get filterInfo() {
        return this.background?.image?.filterInfo;
    }

    get backgroundWatermarkEnable() {
        return !!this.background?.watermarkEnable;
    }

    get backgroundColor() {
        return this.background?.color;
    }

    /**
     * @deprecated
     * 废弃字段，禁止model实例化时merge被赋值
     */
    set backgroundColor(v) {
        console.warn('layout.backgroundColor已废弃');
    }

    get backgroundGradient() {
        return this.background?.gradient;
    }

    get backgroundImage() {
        return this.$backgroundImage;
    }

    get backgroundImageInfo() {
        if (!this.background?.image) return null;

        const image = this.background.image;
        return {
            transform: image.imageTransform,
            width: image.naturalWidth,
            height: image.naturalHeight,
            opacity: image.opacity,
        };
    }

    /**
     * @deprecated
     * 废弃字段，禁止model实例化时merge被赋值
     */
    set backgroundImageInfo(v) {
        console.warn('layout.backgroundImageInfo已废弃');
    }
}

export default LayoutModel;
