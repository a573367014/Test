/**
 * @class EditorVideoElementMixin
 * @description 元素的专属方法
 */
import { assign, pick } from 'lodash';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import VideoRenderer from '@gaoding/editor-framework/src/utils/renderer/video';

export default {
    /**
     * 添加视频元素
     * @memberof EditorVideoElementMixin
     * @param {String} url - 视频路径
     * @param {Object} options - 视频其他参数，查看{@link module:EditorDefaults.element|element}
     */
    addVideo(url, options) {
        const data = assign(
            {
                type: 'video',
                volume: 1,
                url,
            },
            options,
        );

        return this.addElement(data);
    },

    /**
     * 播放指定时间的视频画面
     * @memberof EditorVideoElementMixin
     * @param {element} element - 视频元素
     * @param {Number} time - 要 seek 的时间
     */
    seekVideo(element, time) {
        if (element && element.type === 'video') {
            element.$currentTime = time;
        }
    },

    /**
     * 播放视频
     * @memberof EditorVideoElementMixin
     * @param {element} element - 视频元素
     * @param {Number} time - 开始播放的时间点
     */
    async playVideo(element, time) {
        if (!element || element.type !== 'video') return;

        await this.$nextTick();
        time && this.seekVideo(element, time);
        element.$playing = true;
    },

    /**
     * 暂停视频
     * @memberof EditorVideoElementMixin
     * @param {Object} element - 视频元素
     * @param {Number} time - 暂停的时间点 - 用来纠正播放可能出现偏移的情况
     */
    pauseVideo(element, time) {
        if (!element || element.type !== 'video') return;

        element.$playing = false;
        time && this.seekVideo(element, time);
    },

    /**
     * 停止播放视频, 并把 currentTime 设为 0
     * @memberof EditorVideoElementMixin
     * @param {element} element - 视频元素
     */
    stopVideo(element) {
        this.pauseVideo(element, 0);
    },

    /**
     * 替换 `videoElement` 视频元素
     * @memberof EditorVideoElementMixin
     * @param {String} url - 新视频地址
     * @param {Object} options - 替换参数
     * @param {Boolean} [options.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
     * @param {Number} [options.width] - 新视频的尺寸宽度
     * @param {Number} [options.height] - 新视频的尺寸高度
     * @param {Number} [options.naturalDuration] - 新视频的持续时间
     * @param {element} element - 被替换的元素
     * @param {Boolean} makeSnapshot - 是否创建快照
     */
    replaceVideo(url, options, element, makeSnapshot = true) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const type = element.type;
        if (type !== 'video') {
            return;
        }

        options = assign(
            {
                forwardEdit: true,
            },
            options,
        );

        const elementWidth = element.width;
        const elementHeight = element.height;
        const imgWidth = options.width || elementWidth;
        const imgHeight = options.height || elementHeight;

        // 短边放大，cover
        const ratio = Math.max(elementWidth / imgWidth, elementHeight / imgHeight);
        const width = imgWidth * ratio;
        const height = imgHeight * ratio;

        element.imageTransform = element.parseTransform({ a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 });

        const { animation } = element;
        const naturalDuration =
            typeof options.duration === 'number'
                ? options.duration * 1000
                : options.naturalDuration;

        const { delay } = this.getTimeRange(element);
        this.setTimeRange(delay, naturalDuration);

        this.changeElement(
            {
                url: url,
                imageTransform: element.imageTransform,
                naturalWidth: imgWidth,
                naturalHeight: imgHeight,
                $imageWidth: width,
                $imageHeight: height,
                startTime: 0,
                endTime: naturalDuration,
                naturalDuration,
                animation,
                invertPlay: false,
            },
            element,
            makeSnapshot,
        );

        if (options.forwardEdit && element !== this.currentSubElement) {
            this.showVideoCroper(element);
        }
    },

    /**
     * `videoElement` 视频元素进入剪裁状态
     * @memberof EditorVideoElementMixin
     * @param {element} element - 视频元素应用
     */
    showVideoCroper(element) {
        element = this.getElement(element);

        element.$originalType = 'video';
        this.currentCropElement = element;
    },

    /**
     * 编辑器的当前处于剪裁状态的 `videoElement` 视频元素，退出剪裁状态
     * @memberof EditorVideoElementMixin
     */
    hideVideoCroper() {
        this.currentCropElement = null;
    },

    /**
     * 视频元素转换为图片或蒙版元素
     * @memberof EditorMaskElementMixin
     * @param  {element} element - 被转换视频元素
     * @param {Object} replaceOption - 替换参数
     * @param {Boolean} [replaceOption.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
     * @param {Number} [replaceOption.width] - 新的尺寸宽度
     * @param {Number} [replaceOption.height] - 新的尺寸高度
     * @param {Number} [replaceOption.url] - 资源地址
     * @param {Number} [replaceOption.startTime] - 开始时间
     * @param {Number} [replaceOption.endTime] - 结束时间
     * @param {Number} [replaceOption.naturalDuration] - 持续时间
     * @param  {layout} layout  - 元素所在的布局
     * @return {element}        创建的图片或蒙版元素
     */
    async convertVideoToImage(element, replaceOption = {}, layout) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const defaultElement = editorDefaults.element;
        const defaultImageElement = element.mask
            ? editorDefaults.maskElement
            : editorDefaults.imageElement;
        const props = []
            .concat(Object.keys(defaultImageElement))
            .concat(Object.keys(defaultElement));
        const data = pick(element, props);

        // image props
        data.type = element.mask ? 'mask' : 'image';
        data.version = editorDefaults.version;
        data.url = replaceOption.url || element.url;
        data.startTime = replaceOption.startTime || 0;
        data.endTime = replaceOption.endTime || 0;
        data.naturalDuration = replaceOption.naturalDuration || 0;

        if (element.invertPlay) {
            const { endTime, startTime } = data;
            data.startTime = data.naturalDuration - endTime;
            data.endTime = data.naturalDuration - startTime;
        }

        if (!replaceOption.url) {
            const renderer = new VideoRenderer({ model: element, editor: self }).render();
            data.url = await renderer.export().then((canvas) => {
                if (this.options.resource.blobUrlEnable) {
                    return new Promise((resolve) => {
                        canvas.toBlob(
                            (blob) => {
                                resolve(URL.createObjectURL(blob));
                            },
                            'image/jpg',
                            0.9,
                        );
                    });
                } else {
                    return canvas.toDataURL('image/jpg', 0.9);
                }
            });
        }

        let newElement;
        this.makeSnapshotTransact(() => {
            newElement = this.replaceElement(element, data, layout);

            if (replaceOption.url) {
                this.replaceImage(data.url, replaceOption, newElement);
            }
        });

        this.focusElement(newElement);
        return newElement;
    },

    /**
     * 蒙版或图片元素转换为视频元素
     * @memberof EditorMaskElementMixin
     * @param  {element} element - 被转换蒙版元素
     * @param {Object} replaceOption - 替换参数
     * @param {Boolean} [replaceOption.forwardEdit=true] - 替换后进入元素编辑状态 `showElementEditor`
     * @param {Number} [replaceOption.width] - 新的尺寸宽度
     * @param {Number} [replaceOption.height] - 新的尺寸高度
     * @param {Number} [replaceOption.url] - 资源地址
     * @param {Number} [replaceOption.startTime] - 开始时间
     * @param {Number} [replaceOption.endTime] - 结束时间
     * @param {Number} [replaceOption.naturalDuration] - 持续时间
     * @param  {layout} layout  - 元素所在的布局
     * @return {element}        创建的视频元素
     */
    convertImageToVideo(element, replaceOption = {}, layout) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const defaultElement = editorDefaults.element;
        const defaultImageElement = editorDefaults.videoElement;
        const props = []
            .concat(Object.keys(defaultImageElement))
            .concat(Object.keys(defaultElement));
        const data = pick(element, props);

        // image props
        data.type = 'video';
        data.url = replaceOption.url || element.url;
        data.version = editorDefaults.version;
        data.startTime = replaceOption.startTime || 0;
        data.endTime = replaceOption.endTime || 0;
        data.naturalDuration = replaceOption.naturalDuration || 0;

        let newElement;
        this.makeSnapshotTransact(() => {
            newElement = this.replaceElement(element, data, layout);

            if (replaceOption.url) {
                this.replaceVideo(data.url, replaceOption, newElement);
            }
        });

        this.focusElement(newElement);
        return newElement;
    },
};
