import Promise from 'bluebird';
import { throttle, get } from 'lodash';
import template from './template.html';
import MosaicRender from '../../utils/renderer/mosaic';
import utils from '../../utils/utils';

export default {
    props: ['editor', 'global', 'options', 'layout', 'elements'],
    name: 'background-mosaic',
    template,
    data() {
        return {
            canvasRendered: false,
        };
    },
    computed: {
        mosaic() {
            return this.layout.mosaic;
        },
        mosaicType() {
            return this.mosaic.type;
        },
        mosaicPaths() {
            return this.mosaic.paths;
        },
        cssStyle() {
            const { layout, global } = this;
            const { width, height } = layout;
            const style = {
                width: width * global.zoom + 'px',
                height: height * global.zoom + 'px',
            };

            return style;
        },
        imageUrl() {
            if (this.options.operateMode !== 'mosaic' && !this.canvasRendered) {
                return utils.getComputedUrl(this.mosaic.imageUrl, this.options.fitCrossOrigin);
            }
            return '';
        },
        rendererId() {
            return this.layout.$id + '-mosaic';
        },
        isDesignMode() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },
    },
    mounted() {
        this.mosaicRenderer = this.createRenderer();
        this.$watch(
            () => {
                const mosaic = this.mosaic;
                const rootPropStr = [mosaic.url, mosaic.color, mosaic.type].join('');

                const pathPropStr = this.mosaicPaths.reduce((str, path) => {
                    return (
                        str +
                        [
                            path.left,
                            path.top,
                            path.width,
                            path.height,
                            path.rotate,
                            path.scaleX,
                            path.scaleY,
                            path.path,
                            path.hidden,
                        ].join('')
                    );
                }, '');

                return rootPropStr + pathPropStr;
            },
            () => {
                if (!this.isDesignMode) return;
                this.render();
            },
        );

        // 会重新渲染马赛克背景
        this.$watch(
            () => {
                const { backgroundEffectImage, width, height } = this.layout;
                return []
                    .concat(
                        backgroundEffectImage,
                        width,
                        height,
                        this.mosaic.tileWidth,
                        this.mosaic.tileHeight,
                        this.mosaic.blur,
                    )
                    .join(' ');
            },
            () => {
                if (!this.isDesignMode) return;
                this.lazyRender();
            },
        );
        this.$watch('layout.background', {
            deep: true,
            handler: () => {
                if (!this.isDesignMode) return;
                this.lazyRender();
            },
        });

        this.$watch(
            () => {
                const { background, backgroundEffectImage } = this.layout;
                return [get(background, 'image.url', ''), backgroundEffectImage];
            },
            () => {
                this.checkLoad();
            },
        );

        this.checkLoad();
    },
    beforeDestroy() {
        this.editor.$renderers.destory(this.rendererId);
    },
    methods: {
        checkLoad() {
            let promise;
            this.layout.$backgroundLoaded = false;

            if (this.imageUrl) {
                promise = utils.loadImage(this.imageUrl);
            } else {
                promise = this.lazyRender(false);
            }

            return Promise.try(() => promise).finally(() => {
                this.layout.$backgroundLoaded = true;
                this.editor.$events.$emit('background.loaded');
            });
        },
        createRenderer() {
            const editor = this.editor;
            const layout = this.editor.getLayout(this.layout.$id);
            let mosaicRenderer = editor.$renderers.get(this.rendererId);

            if (mosaicRenderer) {
                editor.$renderers.count(this.rendererId);
                mosaicRenderer.layout = layout;
            } else {
                mosaicRenderer = editor.$renderers.create(
                    this.rendererId,
                    new MosaicRender({
                        layout,
                        editor,
                    }),
                );
            }

            return mosaicRenderer;
        },
        render() {
            this.canvasRendered = true;
            return this.mosaicRenderer.render().then(() => {
                this.layout.mosaic.imageUrl = '';
            });
        },
        lazyRender: throttle(function () {
            return this.render();
        }, 100),
    },
    watch: {
        'options.operateMode'(v) {
            if (!this.isDesignMode || v !== 'mosaic') return;
            this.render();
        },
    },
    events: {
        'mosaicRenderer.renderAfter'(layout) {
            if (this.layout.$id === layout.$id) {
                this.mosaicRenderer.renderByCanvas(this.$refs.canvas, this.mosaicRenderer.canvas);
            }
        },
    },
};
