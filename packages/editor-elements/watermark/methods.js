/**
 * @class EditorWatermarkElementMixin
 * @description 元素的专属方法
 */
import EditorDefault from '@gaoding/editor-framework/src/base/editor-defaults';
import cloneDeep from 'lodash/cloneDeep';
import Transform from '@gaoding/editor-utils/transform';
import {
    logoPropsToImageProps,
    titlePropsToTextProps,
    infoPropsToTextProps,
    infoPropsToImageProps,
    isTextElement,
    changeTextColor,
    changeImageColor,
} from './utils';
import { isGroup } from '@gaoding/editor-utils/element';

// 检查导入的模板元素是否已经加载
function autoImportSyncComponent(template, editor) {
    const supportTypes = editor.supportTypes;
    const types = supportTypes.includes('group') ? [] : ['group'];
    editor.walkTemplet(
        (element) => {
            const type = element.type;
            if (!supportTypes.includes(type) && !types.includes(type)) {
                types.push(type);
            }
        },
        true,
        [template],
    );
    return Promise.all(
        types.map((type) => {
            return editor.createAsyncComponent({ type });
        }),
    );
}

export default {
    /**
     * 设置水印中的模板
     * @memberof EditorWatermarkElementMixin
     * @param { Element } template - 水印的模板
     * @param { Element } element - 设置模板的水印元素
     */
    setWatermarkTemplate(template, element) {
        element = this.getElement(element);

        if (!element || element.type !== 'watermark') {
            return;
        }

        return autoImportSyncComponent(template, this).then(() => {
            template = this.createElement(cloneDeep(template));
            template.$parentId = element.$id;

            // 需要根据当前水印的拉伸比例修改模板的尺寸
            template.left = 0;
            template.top = 0;

            const ratio = element.template.width / template.width;
            element.cellWidth = element.template.width = template.width * ratio;
            element.cellHeight = element.template.height = template.height * ratio;

            if (element.waterType === 0) {
                element.width = template.width * ratio;
                element.height = template.height * ratio;
            }

            return this.resizeElements([template], ratio).then(() => {
                const {
                    logo,
                    title,
                    $logoModel,
                    aggregatedColors,
                    fontFamily,
                    fontWeight,
                    fontStyle,
                } = element;
                let color;

                if (aggregatedColors) {
                    color = {};
                    aggregatedColors.forEach((c) => {
                        color[c.key] = c.color;
                    });
                }

                element.setTemplate(template);
                if (logo && $logoModel) {
                    Object.assign(element.$logoModel, {
                        $renderId: $logoModel.$renderId,
                        url: $logoModel.url,
                        imageTransform: $logoModel.parseTransform($logoModel.imageTransform),
                        naturalWidth: $logoModel.naturalWidth,
                        naturalHeight: $logoModel.naturalHeight,
                    });
                }

                this.changeWatermark(
                    {
                        logo,
                        title,
                        color,
                        fontFamily,
                        fontWeight,
                        fontStyle,
                    },
                    element,
                );

                this.makeSnapshot('change_watermark_template');
            });
        });
    },

    /**
     * 修改水印元素属性
     * @memberof EditorWatermarkElementMixin
     * @param {Object} props 多个属性对象
     * @param {WatermarkElement} element 水印元素
     * @param {boolean} makeSnapshot 保存快照
     */
    changeWatermark(props, element, makeSnapshot = true) {
        element = this.getElement(element);
        if (!element || element.type !== 'watermark') {
            return;
        }

        let needRender = false;
        const logoProps = element.$logoModel && logoPropsToImageProps(props);
        const titleProps = element.$titleModel && titlePropsToTextProps(props);
        const infoTextProps =
            element.$infoModels.length > 0 && infoPropsToTextProps(props, element.$infoModels);
        const infoImageProps =
            element.$infoModels.length > 0 && infoPropsToImageProps(props, element.$infoModels);
        // const backgroundProps = element.$backgroundModel && backgroundPropsToImageProps(props, element.$backgroundModel);
        if (logoProps) {
            this.changeElement(logoProps, [element.$logoModel], false);
            needRender = true;
        }

        if (titleProps) {
            this.changeElement(titleProps, [element.$titleModel], false);
            needRender = true;
        }
        if (infoTextProps) {
            infoTextProps.forEach((infoProp, index) => {
                if (infoProp) {
                    let textModel = element.$infoModels[index];
                    if (isGroup(textModel)) {
                        textModel = textModel.elements.find((model) => isTextElement(model));
                    }
                    if (isTextElement(textModel)) {
                        this.changeElement(infoProp, [textModel], false);
                    }
                    needRender = true;
                }
            });
        }

        if (infoImageProps) {
            infoImageProps.forEach((infoProp, index) => {
                if (infoProp) {
                    let imageModel = element.$infoModels[index];
                    if (isGroup(imageModel)) {
                        imageModel = imageModel.elements.find(
                            (model) =>
                                model.type === 'image' ||
                                model.type === 'mask' ||
                                model.type === 'svg',
                        );
                    }
                    if (imageModel) {
                        this.changeElement(infoProp, [imageModel], false);
                    }
                    needRender = true;
                }
            });
        }

        if (props.color) {
            const keys = Object.keys(props.color);
            if (keys.some((key) => ['textColor', 'effectColor'].includes(key))) {
                const { textColor, effectColor } = props.color;
                element.$textModels.forEach((textModel) => {
                    if (textModel.colorChange) {
                        changeTextColor(textColor, effectColor, textModel, this);
                    }
                });
            }

            if (keys.some((key) => ['effect', 'effectColor', 'textColor'].includes(key))) {
                const { effect, effectColor, textColor } = props.color;
                element.$effectModels.forEach((effectModel) => {
                    if (effectModel.colorChange) {
                        if (effectModel.category === 'ICON') {
                            changeImageColor(null, textColor, effectModel, this);
                        } else {
                            changeImageColor(effect, effectColor, effectModel, this);
                        }
                    }
                });
            }

            if (
                element.$backgroundModel &&
                keys.some((key) => ['backgroundImage', 'backgroundColor'].includes(key))
            ) {
                const { backgroundImage, backgroundColor } = props.color;
                changeImageColor(backgroundImage, backgroundColor, element.$backgroundModel, this);
            }
            needRender = true;
        }

        if (needRender) {
            element.$renderVersion += 1;
        }

        makeSnapshot && this.makeSnapshot('change_element');
    },

    /**
     * 修改水印元素的 logo 图片地址
     * @memberof EditorWatermarkElementMixin
     * @param { String } url - 图片地址
     * @param { Element } element - 水印元素
     */
    changeWatermarkLogo(url, { width, height }, element) {
        element = this.getElement(element);

        if (!element || element.type !== 'watermark') {
            return;
        }

        this.replaceImage(
            url,
            { forwardEdit: element.waterType !== 1, width, height },
            element.$logoModel,
            false,
        );
        this.changeElement(
            {
                logo: { url },
            },
            element,
            false,
        );
        this.makeSnapshot('change_watermark_logo');
    },

    flipWatermarkLogo(dir, element) {
        element = this.getElement(element);

        if (!element || element.type !== 'watermark') {
            return;
        }

        this.flipElement(dir, element.$logoModel);
        this.$events.$emit('element.watermarkUpdated', element, true);
    },

    /**
     * 通过组元素创建水印元素
     * @memberof EditorWatermarkElementMixin
     * @param { GroupElement } - 组元素
     * @param { Object } - 水印元素的基本配置
     */
    createWatermarkByGroup(groupElement, options) {
        if (!isGroup(groupElement)) {
            return {};
        }

        const element = cloneDeep(groupElement);
        delete element.uuid;
        delete element.$id;

        const watermark = Object.assign(
            {
                type: 'watermark',
            },
            cloneDeep(EditorDefault.watermarkElement),
            options,
        );

        watermark.cellWidth = element.width;
        watermark.cellHeight = element.height;
        watermark.cellTop = element.top;
        watermark.cellLeft = element.left;
        if (watermark.waterType === 0) {
            watermark.width = watermark.cellWidth = element.width;
            watermark.height = watermark.cellHeight = element.height;
            watermark.left = element.left;
            watermark.top = element.top;
        }

        element.left = 0;
        element.top = 0;
        watermark.template = element;

        return this.createElement(watermark);
    },

    /**
     * 全屏水印进入编辑状态
     * @memberof EditorWatermarkElementMixin
     * @param { Element } element
     */
    showWatermarkEditor(element) {
        element = this.getElement(element);
        if (element.type !== 'watermark' || element.waterType !== 1) {
            return;
        }

        this.currentEditWatermark = element;
    },

    /**
     * 退出全屏水印编辑状态
     * @memberof EditorWatermarkElementMixin
     */
    hideWatermarkEditor() {
        this.currentEditWatermark = null;
    },

    /**
     * 设置水印类型
     * @memberof EditorWatermarkElementMixin
     * @param { Number } waterType 1 全屏水印 0 常规水印
     * @param { element } element 水印元素
     * @param { layout } layout layout
     */
    setWatermarkType(waterType, element, layout) {
        element = this.getElement(element);
        if (!element || element.type !== 'watermark') {
            return;
        }

        if (waterType === 1) {
            if (!layout) {
                layout = this.getLayoutByElement(element) || this.currentLayout;
            }
            const { width, height } = layout;
            this.changeElement(
                {
                    width: width,
                    height: height,
                    top: 0,
                    left: 0,
                    dragable: false,
                    rotatable: false,
                    transform: element.parseTransform(new Transform()),
                    resize: 0,
                    waterType,
                },
                element,
            );
        } else {
            const {
                template: { width, height },
                cellLeft,
                cellTop,
                cellTransform,
            } = element;
            this.changeElement({
                cellWidth: width,
                cellHeight: height,
                left: cellLeft,
                top: cellTop,
                width,
                height,
                rotatable: true,
                dragable: true,
                transform: cellTransform,
                resize: 1,
                imageUrl: '',
                imageWidth: 0,
                imageHeight: 0,
                waterType,
            });
        }
    },
};
