import Promise from 'bluebird';
import tinycolor from 'tinycolor2';
import utils from '../utils/utils';
import template from './global-background.html';
import { isNil } from 'lodash';

export default {
    name: 'global-background',
    template,
    // eslint-disable-next-line
    props: ['layout', 'globalLayout', 'global', 'options', 'selected', 'mode', 'editor'],

    computed: {
        layoutSize() {
            const {
                editor,
                options: { globalBackgroundHeight = 0 },
            } = this;
            if (!editor) {
                return { width: 0, height: 0 };
            }

            let allHeight = 0;
            let maxHeight = 0;
            let maxWidth = 0;
            editor.layouts.forEach((it) => {
                allHeight += it.height;
                if (it.height > maxHeight) {
                    maxHeight = it.height;
                }
                if (it.width > maxWidth) {
                    maxWidth = it.width;
                }
            });

            const isMirror = editor.mode === 'mirror';
            // 由于 mirror页 分页导致总高度无法计算, 所以这里使用 global.layout.height
            const height = isMirror
                ? this.globalLayout.height
                : globalBackgroundHeight || allHeight;

            // 多页视图下以所有 layout 高度作为背景高度
            return {
                height,
                width: maxWidth,
            };
        },

        isRepeat() {
            return (
                this.globalLayout.backgroundRepeat &&
                this.globalLayout.backgroundRepeat !== 'no-repeat'
            );
        },

        imageUrl() {
            return utils.getComputedUrl(
                this.globalLayout.backgroundImage,
                this.options.fitCrossOrigin,
            );
        },

        backgroundImageInfo() {
            return (
                this.globalLayout.backgroundImageInfo || {
                    transform: {
                        a: 1,
                        b: 0,
                        c: 0,
                        d: 1,
                        tx: 0,
                        ty: 0,
                    },
                    opacity: 1,
                }
            );
        },

        backgroundSize() {
            return this.globalLayout.backgroundSize || [0, 0];
        },

        layoutBackgroundColor() {
            const color = this.globalLayout.backgroundColor;
            return color ? tinycolor(color).toString('rgb') : 'transparent';
        },

        transform() {
            const { transform } = this.backgroundImageInfo;
            const { a, b, c, d } = transform;
            return `matrix(${a},${b},${c},${d},${0},${0})`;
        },

        cssStyle() {
            const {
                editor,
                layoutSize,
                layout,
                layoutBackgroundColor,
                options: { hiddenGlobalBackground: hidden = false },
                global: { zoom },
            } = this;
            const index = editor.layouts.indexOf(layout);
            let top = 0;
            editor.layouts.forEach((layout, inx) => {
                const { height } = layout;
                if (index > inx) top += height;
            });

            // TODO: 由于 mirror 页分页会造成top值计算异常, 所以这里优先使用 $mirrorTop
            const { $mirrorTop } = layout;
            const layoutTop = isNil($mirrorTop) ? -top : $mirrorTop;

            const style = {
                position: 'relative',
                top: `${layoutTop * zoom}px`,
                width: `${layoutSize.width * zoom}px`,
                height: `${layoutSize.height * zoom}px`,
                backgroundColor: layoutBackgroundColor,
                display: hidden ? 'none' : 'block',
            };
            return style;
        },

        mainStyle() {
            const {
                backgroundImageInfo,
                backgroundSize,
                globalLayout,
                global: { zoom = 1 },
            } = this;

            return this.isRepeat
                ? {
                      backgroundRepeat: globalLayout.backgroundRepeat,
                      backgroundSize: `${backgroundSize[0] * zoom}px ${backgroundSize[1] * zoom}px`,
                      backgroundPosition: `${backgroundImageInfo.transform.tx * zoom}px ${
                          backgroundImageInfo.transform.ty * zoom
                      }px`,
                      backgroundImage: globalLayout.backgroundImage
                          ? `url(${globalLayout.backgroundImage})`
                          : null,
                      opacity: backgroundImageInfo.opacity,
                      transform: this.transform,
                  }
                : {
                      transform: this.transform,
                  };
        },

        imageStyle() {
            const {
                backgroundImageInfo,
                backgroundSize,
                global: { zoom = 1 },
            } = this;

            return {
                width: `${backgroundSize[0] * zoom}px`,
                height: `${backgroundSize[1] * zoom}px`,
                left: `${backgroundImageInfo.transform.tx * zoom}px`,
                top: `${backgroundImageInfo.transform.ty * zoom}px`,
                opacity: 1,
            };
        },
    },

    watch: {
        imageUrl() {
            this.checkLoad();
        },
        layoutSize: 'syncHeight',
    },
    events: {
        'base.click'(e) {
            this.onClick(e);
        },
    },
    created() {
        this.checkLoad();
    },

    methods: {
        checkLoad() {
            const { options, mode, editor } = this;
            const { fitCrossOrigin, hiddenGlobalBackground = false } = options;
            const { loadImage } = utils;

            let promise =
                !hiddenGlobalBackground && this.imageUrl
                    ? loadImage(this.imageUrl, fitCrossOrigin)
                    : Promise.resolve();
            this.$set(editor.global, '$backgroundLoaded', false);

            promise = promise.finally(() => {
                // 截图页面渲染背景大图也需要时间，这里加个 120 的延时保证背景大图渲染
                const time = mode === 'mirror' ? 120 : 0;
                setTimeout(() => {
                    editor.global.$backgroundLoaded = true;
                    this.editor.$events.$emit('globalBackground.loaded');
                }, time);
            });

            return promise;
        },

        syncHeight() {
            const { mode, layoutSize, globalLayout } = this;
            const { backgroundSize } = globalLayout;

            if (mode === 'mirror') return;

            if (
                Math.abs(layoutSize.width - globalLayout.width) > 2 ||
                Math.abs(layoutSize.height - globalLayout.height) > 2
            ) {
                if (backgroundSize && backgroundSize[0]) {
                    const ratio = Math.max(
                        layoutSize.width / backgroundSize[0],
                        layoutSize.height / backgroundSize[1],
                    );
                    const size = [backgroundSize[0] * ratio, backgroundSize[1] * ratio];
                    const position = [
                        -(size[0] - layoutSize.width) / 2,
                        -(size[1] - layoutSize.height) / 2,
                    ];

                    this.globalLayout.backgroundSize = size;
                    this.globalLayout.backgroundImageInfo.transform.tx = position[0];
                    this.globalLayout.backgroundImageInfo.transform.ty = position[1];
                }

                this.globalLayout.height = layoutSize.height;
                this.globalLayout.width = layoutSize.width;

                this.editor.$emit('editor.background.update');
            }
        },

        onClick(e) {
            const { globalLayout, editor } = this;
            const point = editor.pointFromEvent(e);
            const { layout } = this.editor.global;
            if (!layout) return;

            this.$nextTick(() => {
                // 不在在容器内
                const isSelected =
                    point.x < 0 ||
                    point.y < 0 ||
                    point.x > globalLayout.width ||
                    point.y > globalLayout.height;

                this.editor.global.layout.$backgroundSelected = isSelected;
            });
        },
    },
};
