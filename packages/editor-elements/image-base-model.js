import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import { useEffects } from '@gaoding/editor-framework/src/utils/model-adaptation';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import { editorResourceMap } from '@gaoding/editor-framework/src/utils/export-resource';

class ImageBaseModel extends BaseModel {
    constructor(data, options = {}) {
        super(data);

        this.imageTransform = this.parseTransform(this.imageTransform);

        this.imageEffects && useEffects(this, true);

        const hasEffects = this.hasEffects;
        const hasFilters = this.hasFilters;

        // 旧版本图片特效重新渲染
        if (!data.effectedResult && hasEffects) {
            this.imageUrl = '';
        }

        // 兼容旧版本
        if (data.isGif) {
            this.resourceType = 'gif';
        }

        // 兼容 loop
        if (typeof data.loop === 'boolean') {
            this.loop = data.loop ? 0 : 1;
        }

        this.filterInfo = data.filterInfo || {
            id: -1,
            url: '',
            strong: 0.8,
            intensity: 0.8,
        };

        if (!hasEffects && this.effectedResult) {
            this.effectedResult.width = 0;
            this.effectedResult.height = 0;
            this.effectedResult.left = 0;
            this.effectedResult.top = 0;
        }

        // 处理可能存在特效结果图，但实际并没有应用特效的错误数据
        if (!hasEffects && !hasFilters) {
            this.effectedImage = '';

            if (this.type === 'image') {
                this.imageUrl = '';
            }
        } else if (this.effectedImage) {
            this.imageUrl = this.effectedImage;
        }

        // 兼容 imageWidth、imageHeight 字段
        if (!data.naturalWidth) {
            this.naturalWidth = data.imageWidth || data.width;
            this.naturalHeight = data.imageHeight || data.height;
            this.$imageLeft = this.imageTransform.position.x;
            this.$imageTop = this.imageTransform.position.y;
        } else {
            this.naturalWidth = data.naturalWidth;
            this.naturalHeight = data.naturalHeight;
        }

        if (this.imageUrl && !this.$renderId) {
            this.$renderId = this.$id;
        }

        if (
            this.imageUrl &&
            (this.imageUrl.startsWith('data:image') || this.isGif || this.isApng)
        ) {
            this.imageUrl = '';
        }

        // 优先获取 editorResourceMap 中的线上地址
        if (editorResourceMap.get(this.$renderId)) {
            this.imageUrl = editorResourceMap.get(this.$renderId);
        } else if (this.imageUrl) {
            editorResourceMap.set(this.$renderId, this.imageUrl);
        }

        this.url = editorResourceMap.get(this.url) || this.url;

        if (!this.$clipCache) {
            this.setClipCache();
        }

        delete this.effectedImage;
        delete this.effectedImageWidth;
        delete this.effectedImageHeight;
        delete this.effectedImageOffsetLeft;
        delete this.effectedImageOffsetTop;
        delete this.imageWidth;
        delete this.imageHeight;
        delete this.originWidth;
        delete this.originHeight;
        delete this.clip;
    }

    setClipCache() {
        this.$clipCache = {
            offsetX: this.imageTransform.position.x,
            offsetY: this.imageTransform.position.y,
            scaleX: this.imageTransform.scale.x,
            scaleY: this.imageTransform.scale.y,
            width: this.width,
            height: this.height,
        };
    }

    set imageWidth(v) {
        if (!this.$id) return;
        this.$imageWidth = v;
        console.error(
            new Error('imageWidth 字段已废弃, 需用 imageTransform.scaleX * naturalWidth 实现'),
        );
    }

    set imageHeight(v) {
        if (!this.$id) return;
        this.$imageHeight = v;
        console.error(
            new Error('imageHeight 字段已废弃, 需用 imageTransform.scaleY * naturalHeight 实现'),
        );
    }

    get $imageWidth() {
        return Math.abs(this.naturalWidth * this.imageTransform.scale.x);
    }

    set $imageWidth(v) {
        if (!this.$id || !this.imageTransform.scale) return;
        const baseNum = this.imageTransform.scale.x < 0 ? -1 : 1;
        this.imageTransform.scale.x = (v / this.naturalWidth) * baseNum;
    }

    get $imageHeight() {
        return Math.abs(this.naturalHeight * this.imageTransform.scale.y);
    }

    set $imageHeight(v) {
        if (!this.$id || !this.imageTransform.scale) return;
        const baseNum = this.imageTransform.scale.y < 0 ? -1 : 1;
        this.imageTransform.scale.y = (v / this.naturalHeight) * baseNum;
    }

    get $imageLeft() {
        const {
            imageTransform: { position },
            $imageWidth,
            width,
        } = this;

        return width / 2 - $imageWidth / 2 + position.x;
    }

    set $imageLeft(v) {
        if (!this.$id || !this.imageTransform.scale) return;
        this.imageTransform.position.x = v + this.$imageWidth / 2 - this.width / 2;
    }

    get $imageTop() {
        const {
            imageTransform: { position },
            $imageHeight,
            height,
        } = this;

        return height / 2 - $imageHeight / 2 + position.y;
    }

    set $imageTop(v) {
        if (!this.$id || !this.imageTransform.scale) return;
        this.imageTransform.position.y = v + this.$imageHeight / 2 - this.height / 2;
    }

    get hasComplexFilters() {
        const { filterInfo } = this;
        return filterInfo && (filterInfo.url || filterInfo.prunedZipUrl);
    }

    get hasBaseFilters() {
        const { filter } = this;
        const defaultFilter = editorDefaults.element.filter;

        if (!filter) return false;
        return Object.keys(filter).some((key) => filter[key] !== defaultFilter[key]);
    }

    get hasFilters() {
        return this.hasBaseFilters || this.hasComplexFilters;
    }

    get hasEffects() {
        return (
            !!(this.imageEffects || []).find((item) => item.enable) ||
            !!(this.shadows || []).find((item) => item.enable)
        );
    }

    get isGif() {
        return this.resourceType === 'gif';
    }

    get isApng() {
        return this.resourceType === 'apng';
    }

    get isVideo() {
        return this.resourceType === 'video' || this.resourceType === 'mp4';
    }

    get $renderProps() {
        return [
            this.width,
            this.height,
            this.opacity,
            this.maskInfo.enable,
            this.imageTransform,
            this.imageEffects,
            this.shadows,
        ];
    }
}

export default ImageBaseModel;
