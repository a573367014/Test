import Vue from 'vue';
import { get, pick } from 'lodash';
import template from './image.html';
import createComponent from '../../base/create-component';

export default createComponent(Vue, {
    template,
    name: 'background-image',
    props: ['editor', 'global', 'options', 'element', 'layout'],
    data() {
        return {
            model: null,
        };
    },
    computed: {
        isDesignMode() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },
        inpaintUrl() {
            return get(this.layout, 'metaInfo.thirdParty.inpaint.url');
        },
        effectImage() {
            const image = get(this.layout, 'background.image');
            if (!image || image.resourceType === 'mp4') return null;

            return {
                ...image,
                transform: image.transform,
                imageTransform: image.imageTransform,
                width: image.width,

                imageUrl: this.layout.backgroundEffectImage,
                url: this.inpaintUrl || image.url,
            };
        },
    },
    watch: {
        effectImage: {
            deep: true,
            immediate: true,
            handler(v) {
                if (!v) {
                    this._cache = null;
                    this.model = null;
                    return;
                }

                v = pick(v, [
                    'url',
                    'imageUrl',
                    'filterInfo',
                    'filter',
                    'naturalWidth',
                    'naturalHeight',
                    'imageTransform',
                    'transform',
                    'width',
                    'height',
                    'left',
                    'top',
                    'opacity',
                    'watermarkEnable',
                    'naturalDuration',
                ]);

                v.left = v.left || 0;
                v.top = v.top || 0;

                const stringify = JSON.stringify(v);
                if (stringify === this._stringifyCache) {
                    return;
                }
                this._stringifyCache = stringify;

                if (!this.model) {
                    this.model = this.editor.createElement({ ...v, type: 'image' });
                    this.model.$id = this.layout.$id;
                } else {
                    Object.assign(this.model, v);
                }
            },
        },

        inpaintUrl(value) {
            if (!value || !this.isDesignMode) return;

            const hasFilters = this.model.hasFilters;

            if (!hasFilters) {
                this.layout.backgroundEffectImage = value;
            } else {
                this.layout.backgroundEffectImage = null;
            }
        },

        'model.$loaded'(v) {
            this.$emit('loaded', v);
        },

        'layout.background.image.url'() {
            if (!this.isDesignMode) return;
            this.layout.backgroundEffectImage = null;
        },

        'model.naturalDuration'(v) {
            if (!this.isDesignMode) return;
            this.$set(this.layout.background.image, 'naturalDuration', v);
        },
    },
    events: {
        async 'imageRenderer.renderAfter'(model) {
            if (!this.isDesignMode || model.$id !== this.model.$id) return;
            this.layout.backgroundEffectImage = null;
        },
    },
    methods: {},
});
