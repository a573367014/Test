/**
 * @class EditorTreeTextMixin
 * @description 元素的专属方法
 */
import { merge, pick } from 'lodash';
import { serialize } from '@gaoding/editor-framework/src/utils/utils';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import ThreeTextRenderer from '@gaoding/editor-framework/src/utils/three-text';

export default {
    /**
     * 变更单个文本元素富文本内容
     * @memberof EditorTreeTextMixin
     * @param  {object} props    多个属性对象
     * @param  {textElement} element 文本元素
     * @param  {boolean} makeSnapshot 保存快照
     */
    changeThreeTextContents(props, element, makeSnapshot) {
        element = this.getElement(element);

        const richText = this.currentRichText;

        if (element.type !== 'threeText') return;

        if (!element.$editing) {
            // 还未进入编辑状态时, 数据控制contents更新
            element.contents = serialize.injectStyleProps(element.contents, props);
            merge(element, props);
            makeSnapshot && this.makeSnapshotByElement(element);
        } else if (richText) {
            // 进入编辑状态时, 命令控制contents更新
            Object.keys(props).forEach((name) => richText.cmd.do(name, props[name]));
        }
    },

    /**
     * 3D文字元素转换为普通文字元素
     * @memberof EditorEffectTextElementMixin
     * @param  {element} element - 被转换3D文字元素
     * @param  {layout} layout  - 元素所在的布局
     * @return {element}        创建的普通文字元素
     */
    convertThreeTextToText(element, layout = this.currentLayout) {
        element = this.getElement(element);
        if (!element) {
            return;
        }

        const defaultElement = editorDefaults.element;
        const defaultTextElement = editorDefaults.textElement;
        const props = []
            .concat(Object.keys(defaultTextElement))
            .concat(Object.keys(defaultElement));
        const data = pick(element, props);

        // image props
        data.type = 'text';
        data.resize = 5;
        data.version = editorDefaults.version;
        const getColor = (albedo) =>
            [albedo.color, '#000000', albedo.gradient.stops[0].color][albedo.type];
        data.color = getColor(element.layers[0].frontMaterials.albedo);

        this.calculateBox(data);
        const centerX = element.left - element.centerRatioX * element.width;
        const centerY = element.top - element.centerRatioY * element.height;
        data.left = centerX - 0.5 * data.width;
        data.top = centerY - 0.5 * data.height;

        const newElement = this.replaceElement(element, data, layout);

        this.focusElement(newElement);
        return newElement;
    },

    async safeThreeTextRender(controlData, model, canvas) {
        if (!this.$threeTextRenderer) {
            this.$threeTextRenderer = new ThreeTextRenderer();
        }
        try {
            await this.$threeTextRenderer.requestRenderAll(controlData, model, canvas);
        } catch (e) {
            console.info(e);
        }
    },

    async getThreeTextCanvas(element) {
        const sourceCanvas = document.createElement('canvas');

        // 出图以两倍清晰度出图，风险，超大尺寸溢出
        const controlData = {
            compositeZoom: 2,
            hasCanvasResize: true,
        };
        await this.safeThreeTextRender(controlData, element, sourceCanvas);

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const { width, height, modelCube = [-1, 1, -1, 1] } = sourceCanvas;

        canvas.width = element.width;
        canvas.height = element.height;

        const sx = Math.floor(((modelCube[0] + 1) / 2) * width);
        const sy = Math.floor(((1 - modelCube[3]) / 2) * height);
        // 3D文字尺寸较小时，使用后者数据得到图更清晰
        const sWidth =
            width >= 4096
                ? Math.floor(((modelCube[1] - modelCube[0]) / 2) * width)
                : canvas.width * controlData.compositeZoom;
        const sHeight =
            width >= 4096
                ? Math.floor(((modelCube[3] - modelCube[2]) / 2) * height)
                : canvas.height * controlData.compositeZoom;
        ctx.drawImage(sourceCanvas, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        return canvas;
    },
};
