/**
 * EditorElementCell
 */

import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';

import EditorElement from '@gaoding/editor-framework/src/base/base-element';
import EditorElementCellTpl from './element-cell.html';

/**
 * @class EditorElementCell
 */
export default inherit(EditorElement, {
    name: 'cell-element',
    template: EditorElementCellTpl,
    props: {
        renderModel: {
            type: Object,
            required: true,
        },
    },

    data() {
        return {
            // 鼠标拖拽图片经过该 cell
            dragOverActive: false,
        };
    },

    computed: {
        imageUrl() {
            const { model, options } = this;
            return utils.getComputedUrl(model.url, options.fitCrossOrigin);
        },

        cssStyle() {
            const { renderModel, global } = this;
            const { zoom } = global;

            return {
                height: renderModel.height * zoom + 'px',
                width: renderModel.width * zoom + 'px',
                transform: `translate3d(${renderModel.left * zoom}px, ${
                    renderModel.top * zoom
                }px, 0)`,
            };
        },

        imageStyle() {
            const { opacity, transform } = this;

            return {
                transform: transform.toString(),
                opacity: opacity,
            };
        },

        borderRadius() {
            const zoom = this.global.zoom;
            const { borderRadius } = this.model;
            const { width, height } = this.renderModel;
            const minSize = Math.min(width, height) * zoom;
            return {
                borderRadius: `${(minSize * borderRadius) / 2}px`,
            };
        },

        background() {
            return {
                backgroundColor: this.model.backgroundColor,
            };
        },

        viewBox() {
            const { renderModel } = this;
            return [0, 0, renderModel.width, renderModel.height].join(' ');
        },

        imageRect() {
            const { model, imageFillMode } = this;
            const { width, height } = this.renderModel;
            const { imageWidth, imageHeight, transform, offset, zoom, rotate } = model;

            const dirRotated = rotate === 90 || rotate === 270 || rotate === -90 || rotate === -270;
            let _imageWidth = imageWidth || width;
            let _imageHeight = imageHeight || height;
            // 图片朝向改变
            if (dirRotated) {
                _imageWidth = imageHeight;
                _imageHeight = imageWidth;
            }

            let $width;
            let $height;
            let x;
            let y;
            if (imageFillMode === 'cover') {
                const widthRatio = width / _imageWidth;
                const heightRatio = height / _imageHeight;
                const imageRatio = _imageWidth / _imageHeight;
                if (widthRatio >= heightRatio) {
                    $width = width;
                    $height = $width / imageRatio;
                } else {
                    $height = height;
                    $width = $height * imageRatio;
                }
            } else {
                $width = _imageWidth;
                $height = _imageHeight;
            }
            // 图片的渲染宽高
            $width *= zoom;
            $height *= zoom;

            let dx = 0;
            let dy = 0;

            dx = width / 2 - $width / 2;
            dy = height / 2 - $height / 2;
            const offsetMakeup = {
                x: 0,
                y: 0,
            };
            if (dirRotated) {
                const _width = $width;
                $width = $height;
                $height = _width;
                if (rotate === 90 || rotate === -270) {
                    offsetMakeup.y = -$height;
                    dy = $height / 2 - width / 2;
                    dx = height / 2 - $width / 2;
                } else if (rotate === 270 || rotate === -90) {
                    offsetMakeup.x = -$width;
                    dy = width / 2 - $height / 2;
                    dx = $width / 2 - height / 2;
                }
            } else if (rotate === 180 || rotate === -180) {
                offsetMakeup.y = -$height;
                offsetMakeup.x = -$width;
                dx = $width / 2 - width / 2;
                dy = $height / 2 - height / 2;
            }

            let imgWidth = $width;
            let imgHeight = $height;
            if (dirRotated) {
                imgHeight = $width;
                imgWidth = $height;
            }
            const maxDx = Math.abs(imgWidth / 2 - width / 2);
            const maxDy = Math.abs(imgHeight / 2 - height / 2);
            let _maxDx = maxDx;
            let _maxDy = maxDy;
            if (dirRotated) {
                _maxDx = maxDy;
                _maxDy = maxDx;
            }
            _maxDx = _maxDx / zoom;
            _maxDy = _maxDy / zoom;
            if (offset.x < -_maxDx) {
                offset.x = -_maxDx;
            } else if (offset.x > _maxDx) {
                offset.x = _maxDx;
            }
            if (offset.y < -_maxDy) {
                offset.y = -_maxDy;
            } else if (offset.y > _maxDy) {
                offset.y = _maxDy;
            }

            x = dx + offset.x * transform.scale.x * zoom + offsetMakeup.x * transform.scale.x;
            y = dy + offset.y * transform.scale.y * zoom + offsetMakeup.y * transform.scale.y;
            if (this.model.scaleX === -1) {
                if (rotate === 0 || rotate === 90 || rotate === -270) {
                    x = -x - $width;
                } else if (rotate === 180 || rotate === 270 || rotate === -180 || rotate === -90) {
                    x = $width - x;
                }
            }
            if (this.model.scaleY === -1) {
                if (rotate === 0) {
                    y = -y - $height;
                } else if (rotate === 90 || rotate === -270 || rotate === 180 || rotate === -180) {
                    y = -(y - $height);
                } else if (rotate === 270 || rotate === -90) {
                    y = -($height + y);
                }
            }
            model.$width = $width;
            model.$height = $height;

            const rect = {
                width: $width,
                height: $height,
                x,
                y,
            };

            return rect;
        },

        elementEmpty() {
            return !this.imageUrl && !this.model.backgroundColor;
        },

        imageFillMode() {
            return this.model.mode || 'cover';
        },
    },

    methods: {
        /**
         * 加载图片
         * @memberof
         */
        load() {
            const { url } = this.model;

            if (!url) {
                return Promise.resolve();
            }

            //  TODO: 滤镜功能

            return utils.loadImage(url, this.options.fitCrossOrigin).then((img) => {
                const { model } = this;
                model.imageWidth = img.naturalWidth;
                model.imageHeight = img.naturalHeight;

                model.offset = Object.assign({ x: 0, y: 0 }, model.offset);
                return img;
            });
        },
        zoomTo(zoom) {
            if (zoom < 1 || zoom > 2) return;
            this.model.zoom = zoom;
            this.$events.$emit('element.editApply', this.model, false);
        },
        rotateImage(deg) {
            if (deg >= 360) {
                deg = deg - 360;
            } else if (deg <= -360) {
                deg = deg + 360;
            }
            this.model.rotate = Math.floor(deg);

            this.$events.$emit('element.editApply', this.model, false);
        },
    },

    watch: {
        'model.url'() {
            this.checkLoad();
            this.model.offset.x = 0;
            this.model.offset.y = 0;
            if (!this.model.url) {
                this.model.zoom = 1;
                this.model.scaleX = 1;
                this.model.scaleY = 1;
                this.model.rotate = 0;
            }
        },
        'model.backgroundColor'() {
            if (this.model.backgroundColor) {
                this.model.url = '';
                this.$events.$emit('element.editApply', this.model, false);
            }
        },
        'model.rotate'() {
            this.model.offset.x = 0;
            this.model.offset.y = 0;
            this.model.zoom = 1;
        },
    },

    mounted() {
        this.model.$resizeLimit = true;
        this.model.$getResizeLimit = () => ({
            maxWidth: Infinity,
            minWidth: 2,
            maxHeight: Infinity,
            minHeight: 2,
        });
    },

    events: {
        'editor.cell.zoom'(cell, zoom) {
            if (this.model !== cell || typeof zoom !== 'number') return;

            this.zoomTo(zoom);
        },
        'editor.cell.flip'(cell, dir) {
            if (this.model !== cell || !dir) return;

            const name = dir === 'x' ? 'scaleX' : 'scaleY';
            cell[name] = cell[name] * -1;
            this.$events.$emit('element.editApply', this.model, false);
        },
        'editor.cell.rotate'(cell, deg) {
            if (this.model !== cell || typeof deg !== 'number') return;

            this.rotateImage(deg);
        },
        'editor.cell.dragover'(cell) {
            this.dragOverActive = this.model === cell;
        },
    },
});
