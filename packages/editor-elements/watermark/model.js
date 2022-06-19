import { get, set, cloneDeep } from 'lodash';
import { createCanvas } from '@gaoding/editor-utils/canvas';
import utils from '@gaoding/editor-framework/src/utils/utils';
import BaseModel from '@gaoding/editor-framework/src/base/element-base-model';
import transformMath from '@gaoding/editor-utils/transform-math';

import {
    getRepeat,
    renderRepeat,
    isTextElement,
    aggregatedTextColors,
    aggregatedImageColors,
} from './utils';
import { isGroup } from '@gaoding/editor-utils/element';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';

class WatermarkModel extends BaseModel {
    constructor(data) {
        // 废弃水印元素 FullScreenInfo.Repeat 字段
        if (
            get(data, 'fullScreenInfo.leftIndent') === undefined &&
            get(data, 'fullScreenInfo.repeat')
        ) {
            const repeat = data.fullScreenInfo.repeat;
            const repeatItem = repeat[0];

            set(data, 'fullScreenInfo.leftIndent', get(repeat, '[1].leftIndent', 0));
            set(data, 'fullScreenInfo.colGap', get(repeatItem, 'colGap', 0));
            set(data, 'fullScreenInfo.rowGap', get(repeatItem, 'rowGap', 0));
            set(
                data,
                'template.transform',
                get(repeatItem, 'transform', cloneDeep(editorDefaults.element.transform)),
            );
        }

        super(data);

        this.setTemplate(data.template);
        const isFullScreenWatermark = data.waterType === 1;
        this.rotatable = !isFullScreenWatermark;
        this.dragable = !isFullScreenWatermark;
        // 通过监听 renderVersion 判断是否要更新水印
        this.$renderVersion = 0;
        this.$renderInCanvas = false;
        this.$repeatImageUrl = '';
        this.$repeatImageWidth = 0;
        this.$repeatImageHeight = 0;
        this.cellTransform = this.parseTransform(data.cellTransform);

        if (this.cellWidth === 0 || this.cellHeight === 0) {
            this.cellWidth = get(this, 'template.width', 0);
            this.cellHeight = get(this, 'template.height', 0);
        }

        delete this.fullScreenInfo.repeat;
    }

    setTemplate(template) {
        // 从 template 中找出打标后的 LOGO 与 INFO 元素
        this.$infoModels = [];
        this.$logoModel = null;
        this.$backgroundModel = null;
        this.$titleModel = null;
        this.$textModels = []; // 缓存可以改变颜色的文字元素
        this.$effectModels = []; // 缓存可以改变颜色的图片、svg 元素
        this.$info = [];
        utils.walkTemplet(
            (element) => {
                if (element.category === 'LOGO') {
                    this.$logoModel = element;
                } else if (element.category === 'INFO') {
                    this.$infoModels.push(element);
                } else if (element.category === 'BG') {
                    this.$backgroundModel = element;
                } else if (element.category === 'H1') {
                    this.$titleModel = element;
                }

                if (element.colorChange) {
                    if (['text', 'threeText', 'styleText'].includes(element.type)) {
                        this.$textModels.push(element);
                    } else if (
                        ['image', 'mask', 'svg'].includes(element.type) &&
                        element.category !== 'BG'
                    ) {
                        this.$effectModels.push(element);
                    }
                }

                if (
                    element.autoAdaptive !== 0 &&
                    ['text', 'threeText', 'styleText'].includes(element.type)
                ) {
                    element.autoAdaptive = 2;
                }

                // 设置属性关闭组元素重算包围盒
                if (isGroup(element)) {
                    element.$inWatermark = true;
                }
            },
            true,
            [template],
        );

        template.transform = this.parseTransform(template.transform);
        template.$inWatermark = true;
        this.template = template;
    }

    /**
     * 映射到 watermark.logo.url
     */
    set url(value) {
        this.logo.url = value;
    }

    get url() {
        return this.logo.url;
    }

    set rotate(deg) {
        if (this.waterType === 1) return;

        this.transform.rotation = transformMath.degToRad(deg);
    }

    get rotate() {
        return transformMath.radToDeg(this.rotation);
    }

    set scaleX(v) {
        if (this.waterType === 1) return;

        this.transform.scale.x = v;
    }

    get scaleX() {
        return this.transform.scale.x;
    }

    set scaleY(v) {
        if (this.waterType === 1) return;

        this.transform.scale.y = v;
    }

    get scaleY() {
        return this.transform.scale.y;
    }

    set skewX(v) {
        if (this.waterType === 1) return;

        this.transform.skew.x = v;
    }

    get skewX() {
        return this.transform.skew.x;
    }

    set skewY(v) {
        if (this.waterType === 1) return;

        this.transform.skew.y = v;
    }

    get skewY() {
        return this.transform.skew.y;
    }

    get aggregatedColors() {
        const colors = [
            { key: 'textColor', color: null },
            { key: 'effectColor', color: null },
            { key: 'backgroundColor', color: null },
        ];

        this.$textModels.forEach((textModel) => {
            const { textColor, effectColor } = aggregatedTextColors(textModel);
            if (textColor) {
                colors[0].color = textColor;
            }
            if (effectColor) {
                colors[1].color = effectColor;
            }
        });

        this.$effectModels.forEach((effectModel) => {
            const effectColor = aggregatedImageColors(effectModel);
            if (effectColor) {
                const index = effectModel.category === 'ICON' ? 0 : 1;
                colors[index].color = effectColor;
            }
        });

        if (this.$backgroundModel) {
            const backgroundColor = aggregatedImageColors(this.$backgroundModel);
            if (backgroundColor) {
                colors[2].color = backgroundColor;
            }
        }
        return colors.filter((color) => color.color);
    }

    /** 聚合水印中的字体属性 */
    get aggregatedFonts() {
        const { $titleModel, $infoModels } = this;
        const aggregatedFonts = [];
        if ($titleModel) {
            aggregatedFonts.push({
                fontFamily: $titleModel.fontFamily,
                fontStyle: $titleModel.fontStyle,
                fontWeight: $titleModel.fontWeight,
                linkedId: $titleModel.$id,
            });
        }
        $infoModels.forEach((infoModel) => {
            let textModel = infoModel;
            if (isGroup(textModel)) {
                textModel = infoModel.elements.find((element) => isTextElement(element.type));
            }
            if (isTextElement(textModel)) {
                aggregatedFonts.push({
                    fontFamily: textModel.fontFamily,
                    fontStyle: textModel.fontStyle,
                    fontWeight: textModel.fontWeight,
                    linkedId: textModel.$id,
                });
            }
        });
        return aggregatedFonts;
    }

    get title() {
        const { $titleModel } = this;
        if ($titleModel) {
            return $titleModel.content;
        }
        return undefined;
    }

    get info() {
        const { $infoModels } = this;
        if (!$infoModels) return [];
        return $infoModels.map((infoModel) => {
            const info = {
                type: null,
                content: null,
            };
            if (isTextElement(infoModel)) {
                info.content = infoModel.content;
            } else if (isGroup(infoModel)) {
                utils.walkTemplet(
                    (element) => {
                        if (isTextElement(element)) {
                            info.content = element.content;
                        } else if (element.type === 'svg') {
                            info.type = element.iconType;
                        }
                    },
                    true,
                    [infoModel],
                );
            }

            return info;
        });
    }

    get infoCount() {
        return this.$infoModels.length;
    }

    get fontFamily() {
        const { aggregatedFonts, fontFamilyMixed } = this;
        if (fontFamilyMixed || aggregatedFonts.length === 0) {
            return null;
        }
        return aggregatedFonts[0].fontFamily;
    }

    get fontWeight() {
        const { aggregatedFonts, fontFamilyMixed } = this;
        if (fontFamilyMixed || aggregatedFonts.length === 0) {
            return null;
        }
        return aggregatedFonts[0].fontWeight;
    }

    get fontStyle() {
        const { aggregatedFonts, fontFamilyMixed } = this;
        if (fontFamilyMixed || aggregatedFonts.length === 0) {
            return null;
        }
        return aggregatedFonts[0].fontStyle;
    }

    /**
     * 这些 set 方法是为了防止 changeElement 的时候污染了 watermark 的 json 结构
     */
    /* eslint-disable @typescript-eslint/adjacent-overload-signatures,@typescript-eslint/no-empty-function */
    set fontFamily(value) {}
    set fontWeight(value) {}
    set fontStyle(value) {}
    set title(value) {}
    set info(value) {}

    get fontFamilyMixed() {
        const { aggregatedFonts } = this;
        const font = aggregatedFonts[0];
        if (font) {
            return aggregatedFonts.some((otherFont, index) => {
                return (
                    index > 0 &&
                    otherFont.fontFamily !== font.fontFamily &&
                    otherFont.fontWeight !== font.fontWeight &&
                    otherFont.fontStyle !== font.fontStyle
                );
            });
        }
        return false;
    }

    get hasLogo() {
        return !!this.$logoModel;
    }

    get hasTitle() {
        return !!this.$titleModel;
    }

    get hasInfo() {
        return this.$infoModels.length > 0;
    }

    /**
     * 绘制单元水印
     */
    async renderCell(editor) {
        this.$cellCanvas = null;
        this.$repeatCanvas = null;
        this.$fullScreenCanvas = null;
        this.$cellCanvas = await editor.elementToCanvas(this.template);
        return this.$cellCanvas;
    }

    /**
     * 绘制最小重复单元
     */
    async renderRepeat(editor) {
        this.$fullScreenCanvas = null;
        this.$repeatCanvas = null;

        if (!this.$cellCanvas) {
            await this.renderCell(editor);
        }

        const repeat = getRepeat(this);
        const canvas = renderRepeat(this.$cellCanvas, repeat);
        this.$repeatCanvas = canvas;
        return canvas;
    }

    /**
     * 绘制全屏水印
     */
    async renderFullScreen(editor) {
        this.$fullScreenCanvas = null;
        if (!this.$repeatCanvas) {
            await this.renderRepeat(editor);
        }

        const repeatCanvas = this.$repeatCanvas;
        const { width, height, fullScreenInfo } = this;
        const { left, top } = fullScreenInfo;
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');

        context.save();
        let offsetLeft = left % repeatCanvas.width;
        if (offsetLeft > 0) {
            offsetLeft = offsetLeft - repeatCanvas.width;
        }
        let offsetTop = top % repeatCanvas.height;
        if (offsetTop > 0) {
            offsetTop = offsetTop - repeatCanvas.height;
        }
        context.translate(offsetLeft, offsetTop);
        context.fillStyle = context.createPattern(repeatCanvas, 'repeat');
        context.fillRect(0, 0, width + Math.abs(offsetLeft), height + Math.abs(offsetTop));
        context.restore();

        this.$fullScreenCanvas = canvas;
        return canvas;
    }

    resizeCell(width, height) {
        const { cellWidth, $infoModels } = this;
        this.cellWidth = width;
        this.cellHeight = height;

        const ratio = width / cellWidth;
        $infoModels.forEach((infoModel) => {
            infoModel.elements.forEach((element) => {
                const { relation } = element;
                if (relation) {
                    const { offset, defaultOffset } = relation;
                    [offset, defaultOffset]
                        .filter((offset) => offset)
                        .forEach((offset) => {
                            ['left', 'top', 'width', 'height'].forEach((key) => {
                                offset[key] *= ratio;
                            });
                        });
                }
            });
        });
    }

    // 序列化水印
    exportData() {
        // 兼容 repeat 字段
        const cloneData = { ...this };
        const { fullScreenInfo, template } = cloneData;
        const repeat = [];

        repeat[0] = {
            colGap: fullScreenInfo.colGap,
            rowGap: fullScreenInfo.rowGap,
            transform: template.transform,
            leftIndent: 0,
        };

        if (fullScreenInfo.leftIndent !== 0) {
            repeat[1] = {
                colGap: fullScreenInfo.colGap,
                rowGap: fullScreenInfo.rowGap,
                transform: template.transform,
                leftIndent: fullScreenInfo.leftIndent,
            };
        }

        fullScreenInfo.repeat = repeat;

        return cloneData;
    }
}

export default WatermarkModel;
