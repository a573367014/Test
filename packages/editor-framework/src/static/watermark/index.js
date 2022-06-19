import template from './template.html';
import { throttle, get } from 'lodash';
import { getLayoutWatermark, checkNoRepeat } from '../../utils/renderer/watermark';
import utils from '../../utils/utils';

export default {
    props: ['layout', 'model', 'global', 'options'],
    name: 'watermark',
    template,
    data() {
        return {
            loaded: false,
            naturalWidth: 10,
            naturalHeight: 10,
        };
    },
    computed: {
        isDesignMode() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },
        cssStyle() {
            if (!this.loaded) return {};

            const { width, height } = this.model || this.layout;
            let style = {
                'background-image': 'url(' + this.imageUrl + ')',
                'background-size': width / height > 1 ? 'auto 100%' : '100% auto',
            };

            const isNoRepeat = this.model ? false : checkNoRepeat(width, height);

            if (this.model) {
                style['background-size'] = width / height > 1 ? 'auto 200%' : '200% auto';
            }

            if (isNoRepeat) {
                style = {
                    ...style,
                    'background-size': 'cover',
                    'background-position': 'center',
                    'background-repeat': 'no-repeat',
                };
            }

            // TODO: 只处理 layout，元素担心存在性能影响
            if (this.options.watermarkSafeEnable && this.layout) {
                style = {
                    ...style,
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    width: '100%',
                    height: '100%',
                    opacity: 1,
                    visibility: 'visible',
                    display: 'flex',
                    transform: 'none',
                    zIndex: '5',
                };

                for (const k in style) {
                    style[k] += ' !important';
                }
            }

            return style;
        },
        cssStyleStr() {
            let str = '';
            Object.keys(this.cssStyle).forEach((key) => {
                str += `${key}: ${this.cssStyle[key]};`;
            });

            return str;
        },
        imageUrl() {
            return this.model
                ? this.options.watermarkImages.element
                : getLayoutWatermark(this.layout.width, this.layout.height, this.options);
        },
    },
    events: {},
    methods: {
        observerCallback: throttle(
            function (byBttributes) {
                if (this.global.$draging) return;
                let watermarkEnable;
                if (this.model) {
                    watermarkEnable = this.model.watermarkEnable;
                } else {
                    watermarkEnable =
                        this.layout.watermarkEnable ||
                        this.layout.background?.watermarkEnable ||
                        this.global.showWatermark ||
                        !!get(this.global, 'layout.watermarkEnable');
                }

                if (!watermarkEnable) return;

                if (byBttributes) {
                    this.$el.style.cssText = this.cssStyleStr;
                    this.$el.className = 'editor-watermark';
                    return;
                }

                const watermark = this._parentNode.querySelector('.editor-watermark');
                if (!watermark || watermark.parentNode !== this._parentNode) {
                    this._parentNode.appendChild(this.$el);
                }
            },
            50,
            {
                trailing: false,
            },
        ),
        createObserver() {
            if (!this._parentNode) {
                this._parentNode = this.$el.parentNode;
            }

            let ob = new MutationObserver(() => {
                this.observerCallback();
            });
            this._observerA = ob;

            ob.observe(this._parentNode, {
                childList: true,
            });

            ob = new MutationObserver(() => {
                this.observerCallback(true);
            });
            this._observerB = ob;

            ob.observe(this.$el, {
                attributes: true,
            });
        },
    },
    created() {
        // 海外用户 aws 跨域请求一定要添加 origin 头
        // css 背景图片无法添加 origin 头，优先 js 加载
        utils.loadImage(this.imageUrl).finally(() => {
            this.loaded = true;
        });
    },
    mounted() {
        if (this.isDesignMode && window.MutationObserver && this.options.watermarkSafeEnable) {
            this.createObserver();
        }
    },
    beforeDestroy() {
        this._observerA && this._observerA.disconnect();
        this._observerB && this._observerB.disconnect();
    },
};
