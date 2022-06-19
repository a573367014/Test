<template>
    <div class="eui-v2-editor-text-effects">
        <DropdownEffects
            :panelTitle="panelTitle"
            :editor="editor"
            :effects="effects"
            :current-effect="currentEffect"
            :emptyTip="emptyTip"
            :init-tab="initTab"
            :fill="fill"
            :disabled="disabled"
            :supportNomarl="supportNomarl"
            :manualShowDownIcon="downIcon"
            @hover-change="changeEffectByHover"
            @change="changeEffect"
            @clear="applyDefaultEffect"
            @active="$emit('active', $event)"
            @inactive="$emit('inactive', $event)"
        >
            <template #previewEffect>
                <EditorTextPreviewEffect
                    v-if="showTextPreviewEffect"
                    class="eui-v2-editor-effects-preview"
                    :textSize="26"
                    :editor="editor"
                />
                <EditorImgPreviewEffect
                    v-if="showImgPreviewEffect"
                    class="eui-v2-editor-effects-preview"
                    :editor="editor"
                />
            </template>
        </DropdownEffects>

        <Loading :showLoading="effectActived" :loadingPosition="loadingPosition" />
    </div>
</template>

<script>
import tinycolor from 'tinycolor2';
import cloneDeep from 'lodash/cloneDeep';
import { omit, pick, merge } from 'lodash';
import defaults from 'lodash/defaults';
import DropdownEffects from '../../components/dropdown-effects';
import Loading from '../editor-loading';
import materialMeta from '../../utils/material-meta';
import EditorTextPreviewEffect from '../editor-text-preview-effect';
import EditorImgPreviewEffect from '../editor-img-preview-effect';
import editorDefaults from '@gaoding/editor-framework/src/base/editor-defaults';
import { scaleEffect } from '@gaoding/editor-utils/effect/utils';
import { isTextElement } from '@gaoding/editor-utils/element';
import { addEffect, clearEffects } from '@gaoding/editor-utils/effect/browser/effect-actions';
import { addShadow, clearShadows } from '@gaoding/editor-utils/effect/browser/shadow-actions';
import { adaptationEffectShadows } from '@gaoding/editor-framework/src/utils/model-adaptation';

export default {
    components: {
        EditorTextPreviewEffect,
        EditorImgPreviewEffect,
        DropdownEffects,
        Loading,
    },
    inject: {
        uploadService: {
            default: {},
        },
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        effects: {
            type: Object,
            required: true,
        },
        getMaterial: {
            type: Function,
            default: null,
        },
        maxThreeLength: {
            type: Number,
            default: 20,
        },
        panelTitle: {
            type: String,
            default: '',
        },
        fill: {
            type: String,
            default: '',
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        initTab: {
            type: String,
            default: '',
        },
        currentElement: {
            type: Object,
            default: () => null,
        },
        changeCallback: {
            type: Function,
            default: null,
        },
        supportNomarl: {
            type: Boolean,
            default: true,
        },
        emptyTip: {
            type: String,
            default: '',
        },
        editApply: {
            type: Function,
            default: () => () => {},
        },
        downIcon: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            loadingPosition: null,
            effectActived: false,
            lastBaseImageSize: 0,
        };
    },
    computed: {
        elem() {
            if (this.currentElement) {
                return this.currentElement;
            }
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        elements() {
            if (this.isSelector) {
                return this.editor.currentElement.elements;
            } else {
                return [this.elem];
            }
        },
        currentEffect() {
            let elems = [this.elem];
            if (this.isSelector) {
                elems = this.elem.elements;
            }

            const effectsData = Object.values(this.effects).reduce(
                (val, ret) => ret.concat(val),
                [],
            );
            return elems.map((elem) => {
                const effect = effectsData.find((effect) => {
                    return !!materialMeta.getElementMaterialMetas(elem, effect.id, 'id').length;
                });
                if (effect) {
                    return effect;
                }

                // 默认样式
                if (
                    elem.type === 'threeText' ||
                    elem.type === 'styledText' ||
                    (elem.type === 'effectText' && elem.textEffects && elem.textEffects.length) ||
                    (elem.type === 'text' && elem.textEffects && elem.textEffects.length) ||
                    (elem.type === 'image' && elem.imageEffects && elem.imageEffects.length) ||
                    (elem.shadows && elem.shadows.length)
                ) {
                    return {};
                }
            });
        },
        isSelector() {
            return this.elem.type === '$selector';
        },
        isCrop() {
            return this.elem.type === '$croper' || this.elem.type === '$masker';
        },
        showTextPreviewEffect() {
            if (!isTextElement(this.elem)) {
                return false;
            }
            return (this.elem.textEffects || []).length > 0 || (this.elem.shadows || []).length > 0;
        },
        showImgPreviewEffect() {
            const isImageElement = ['image', 'mask'].includes(this.elem.type);
            if (!isImageElement) {
                return false;
            }
            return (
                (this.elem.imageEffects || []).length > 0 || (this.elem.shadows || []).length > 0
            );
        },
    },
    beforeDestroy() {
        this.editor.$events.$off(
            'imageRenderer.renderEffectBefore',
            this.onImageEffectRenderBefore,
        );
    },
    methods: {
        resetCrop() {
            const { editor } = this;
            if (this.isCrop) {
                editor.$events.$emit('element.editApply', editor.currentElement);
            }
        },
        changeEffect(effect) {
            this.editApply();

            if (effect.disabled) {
                return;
            }

            const id = effect.id;
            let currentEle = this.elem;
            const curElementType = this.elem.type;

            this.$emit('change', effect);

            if (!['three_text', 'styled_text'].includes(effect.type)) {
                this.getElementPosition();
                this.effectActived = true;
            }

            this._lastEffect = effect;
            return this.changeCallback
                ? this.changeCallback(effect)
                : this.getMaterial(id)
                      .then((material) => {
                          if (effect !== this._lastEffect) return;
                          let elemData = effect;
                          if (effect.type !== 'styled_text') {
                              elemData = cloneDeep(material.data.model);
                          }

                          // 过滤无用的特效，避免高级设置面板过多无用选项
                          if (effect.type === 'text_effect' || effect.type === 'image_effect') {
                              // 部分编辑器选择预设没走适配流程，保险起见这里也处理一次
                              adaptationEffectShadows(elemData);
                              const effectKey =
                                  effect.type !== 'text_effect' ? 'imageEffects' : 'textEffects';

                              // 有效特效层并且无填充时，回退到文字颜色
                              effectKey === 'textEffects' &&
                                  elemData[effectKey].forEach((ef) => {
                                      if (!ef.enable) return;
                                      if (ef.filling && ef.filling.enable) return;

                                      ef.filling = cloneDeep(editorDefaults.effect.filling);
                                      ef.filling.color = elemData.color;
                                      ef.filling.enable = true;
                                  });

                              elemData[effectKey] = elemData[effectKey].filter((ef) => {
                                  if (ef.filling && !ef.filling.enable) {
                                      delete ef.filling;
                                  }

                                  if (ef.stroke && !ef.stroke.enable) {
                                      delete ef.stroke;
                                  }
                                  if (ef.insetShadow && !ef.insetShadow.enable) {
                                      delete ef.insetShadow;
                                  }
                                  if (ef.offset && ef.offset.x === 0 && ef.offset.y === 0) {
                                      delete ef.offset;
                                  }
                                  if (ef.skew && ef.skew.x === 0 && ef.skew.y === 0) {
                                      delete ef.skew;
                                  }

                                  return ef.enable;
                              });

                              if (elemData.shadows) {
                                  elemData.shadows = (elemData.shadows || []).filter(
                                      (shadow) => shadow.enable,
                                  );
                              }
                          }

                          const callbackFn = () => {
                              if (curElementType === '$selector') {
                                  currentEle.elements.forEach((element) => {
                                      this.changeElementEffect(element, elemData, material);
                                  });

                                  // changeElementEffect 时 element 类型可能已经被修改
                                  // resetAggregatedColors 会导致修改为之前的 type
                                  currentEle = this.elem;
                                  currentEle.elements.forEach((element) => {
                                      this.editor.resetAggregatedColors(element);
                                  });
                              } else {
                                  this.changeElementEffect(currentEle, elemData, material);
                                  this.editor.resetAggregatedColors(this.elem);
                              }
                          };

                          if (this.editor.makeSnapshotTransact) {
                              this.editor.makeSnapshotTransact(callbackFn);
                          } else {
                              callbackFn();
                          }

                          return elemData;
                      })
                      .finally(() => {
                          this.effectActived = false;
                      });
        },
        changeEffectByHover() {
            // todo: 先不开放
            // if(effect.type !== 'text_effect') return;
            // this.changeEffect(effect);
        },
        changeElementEffect(currentEle, elemData, material = {}) {
            const { id } = material;
            this.$nextTick(() => {
                currentEle.$effectPreviewUrl = id;
            });

            if (elemData.type === 'image' || this.isCrop) {
                return this.applyImageEffect(currentEle, elemData, material);
            } else if (elemData.type === 'text' || elemData.type === 'effectText') {
                return this.applyTextEffect(currentEle, elemData, material);
            } else if (elemData.type === 'threeText') {
                return this.toThreeText(currentEle, elemData, material);
            } else if (elemData.type === 'styledText') {
                return this.toStyledText(currentEle, elemData);
            }
        },
        getElementPosition() {
            const { shellRect, containerRect, zoom, currentElement: curElem } = this.editor;
            const offsetX = containerRect.left + shellRect.left;
            const offsetY = containerRect.top + shellRect.top;
            const left = curElem.left * zoom + offsetX + (curElem.width * zoom - 54) / 2;
            const top = curElem.top * zoom + offsetY + (curElem.height * zoom - 22) / 2;
            this.loadingPosition = {
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
            };
        },
        applyImageEffect(currentEle, elemData) {
            const { editor } = this;

            // 旧方案清理，新方案用 metaInfo.materials
            delete currentEle.materialId;

            editor.toggleSnapshot(false);
            clearEffects(currentEle);
            clearShadows(currentEle);

            [...elemData.imageEffects].reverse().forEach((effect) => {
                addEffect(currentEle, effect);
            });
            [...(elemData.shadows || [])].reverse().forEach((shadow) => {
                addShadow(currentEle, shadow);
            });

            editor.toggleSnapshot(true);

            elemData.aggregatedColors = this.adaptAggregatedColors(
                currentEle,
                elemData.aggregatedColors,
            );
            this.updateLinkIndex(currentEle, elemData.aggregatedColors);

            currentEle.aggregatedColors = [];
            currentEle.$hslDiff = null;
            currentEle.mainColor = null;

            // 处理 metaInfo.materials
            materialMeta.removeElementMaterialMeta(currentEle, materialMeta.IMAGE_EFFECT, 'type');
            // if (material.id) {
            //     materialMeta.addElementMaterialMeta(currentEle, {
            //         id: material.id,
            //         type: materialMeta.IMAGE_EFFECT,
            //         fromUser: true,
            //     });
            // }
            editor.changeElement(
                {
                    ruleIndex: -1,
                    mainColor: elemData.mainColor,
                    aggregatedColors: elemData.aggregatedColors,
                    effectScale: elemData.effectScale || 1,
                    effectedImage: '',
                },
                currentEle,
            );
        },
        applyTextEffect(currentEle, elemData, material = {}) {
            const type = currentEle.type;
            if (type === 'text' || type === 'effectText') {
                this.applyTextEffectToText(currentEle, elemData, material);
            } else {
                const textElem = this.toNormalText(currentEle);
                this.applyTextEffectToText(textElem, elemData, material);
                const elem = omit(this.editor.createElement(textElem), ['width', 'height']);

                this.replaceElement(textElem, elem);
            }
        },
        toNormalText(element) {
            // 处理 metaInfo.materials
            materialMeta.removeElementMaterialMeta(element, materialMeta.THREE_TEXT, 'type');
            materialMeta.removeElementMaterialMeta(element, materialMeta.TEXT_EFFECT, 'type');

            if (element.type === 'styledText') {
                return this.editor.convertStyleTextToText(element);
            } else if (element.type === 'threeText') {
                return this.editor.convertThreeTextToText(element);
            }
            if (element.type === 'effectText') {
                return this.editor.convertEffectTextToText(element);
            }

            return element;
        },
        applyTextEffectToText(currentEle, elemData) {
            const { editor } = this;
            // 点击添加特效时，发送 editer.edit.apply 事件退出编辑状态
            editor.$events.$emit('editor.edit.apply', this.elem);
            clearEffects(currentEle);
            clearShadows(currentEle);

            // 旧方案清理，新方案用 metaInfo.materials
            delete currentEle.materialId;

            if (!elemData) {
                currentEle.aggregatedColors = [];
                currentEle.$hslDiff = null;
                currentEle.mainColor = null;
                return;
            }

            [...elemData.textEffects].reverse().forEach((effect) => {
                addEffect(currentEle, effect);
            });
            [...(elemData.shadows || [])].reverse().forEach((shadow) => {
                addShadow(currentEle, shadow);
            });

            elemData.aggregatedColors = this.adaptAggregatedColors(
                currentEle,
                elemData.aggregatedColors,
            );
            elemData.mainColor = elemData.mainColor || currentEle.mainColor;

            // 更新文本元素自身主色的 $linkIndex
            const linkIndex = elemData.aggregatedColors.findIndex((aggregatedColor) => {
                return tinycolor.equals(elemData.color, aggregatedColor);
            });
            if (linkIndex > -1) {
                elemData.$linkIndex = linkIndex;
            }

            this.updateLinkIndex(currentEle, elemData.aggregatedColors);

            const { fontSize } = elemData;
            const elemFontSize = currentEle.fontSize;
            const effectScale = elemFontSize / fontSize || 1;
            scaleEffect(currentEle, effectScale);
            currentEle.aggregatedColors = [];
            currentEle.$hslDiff = null;
            currentEle.mainColor = null;

            this.removeTextMaterial(currentEle);
            // 处理 metaInfo.materials
            // if (material.id) {
            //     materialMeta.addElementMaterialMeta(currentEle, {
            //         id: material.id,
            //         type: materialMeta.TEXT_EFFECT,
            //         fromUser: true,
            //     });
            // }

            editor.changeElement(
                {
                    ruleIndex: -1,
                    $linkIndex: elemData.$linkIndex || 0,
                    // color: color || currentEle.color,
                    // fontFamily: fontFamily || currentEle.fontFamily,
                    // fontWeight,
                    // fontStyle,
                    disableColor: true,
                    mainColor: elemData.mainColor,
                    aggregatedColors: elemData.aggregatedColors,
                    effectScale: 1,
                },
                currentEle,
            );
        },
        removeTextMaterial(elm) {
            materialMeta.removeElementMaterialMeta(elm, materialMeta.THREE_TEXT, 'type');
            materialMeta.removeElementMaterialMeta(elm, materialMeta.TEXT_EFFECT, 'type');
            materialMeta.removeElementMaterialMeta(elm, materialMeta.TEXT, 'type');
        },
        replaceElement(currentEle, elem) {
            const currentElement = this.elem;

            if (elem?.metaInfo?.batchId) {
                delete elem.metaInfo.batchId;
            }

            if (currentElement.type !== 'group') {
                let element = null;
                if (elem.type === 'text') {
                    element = this.editor.addText(elem.content, omit(elem, ['$id', 'uuid']));
                } else {
                    element = this.editor.addElement(omit(elem, ['$id', 'uuid']));
                }

                this.editor.removeElement(element);

                // 防止 metaInfo 业务数据丢失
                if (currentEle.metaInfo) {
                    element.metaInfo = {
                        ...currentEle.metaInfo,
                        ...(element.metaInfo || {}),
                    };
                }

                // replaceElement 内部包含临时组逻辑、优先使用
                element = this.editor.replaceElement(currentEle, element);
                this.editor.focusElement(element);
            } else {
                elem = this.editor.replaceElement(
                    currentEle,
                    elem,
                    this.editor.getElement(currentEle.$parentId, { deep: true }),
                );
                this.editor.currentSubElement = elem;
            }
        },
        // 适配未添加 aggregatedColors 的历史数据，聚合出所有颜色使其可调
        adaptAggregatedColors(element, aggregatedColors) {
            const effects = element.textEffects || [];

            if (aggregatedColors === undefined) {
                aggregatedColors = [];
                effects.forEach((effect) => {
                    ['stroke', 'filling', 'shadow'].forEach((key) => {
                        if (!effect[key]) return;
                        // 聚合所有未加入 aggregatedColors 的特效颜色
                        const color = aggregatedColors.find((color) => {
                            return tinycolor.equals(effect[key].color, color);
                        });
                        if (!color) {
                            aggregatedColors.push(effect[key].color);
                        }
                    });
                });
            }
            return aggregatedColors;
        },
        // 更新文本与图片特效用于单独调节的 linkIndex
        updateLinkIndex(element, aggregatedColors) {
            [
                ...(element.imageEffects || []),
                ...(element.textEffects || []),
                ...(element.shadows || []).map((shadow) => ({ shadow })),
            ].forEach((effect) => {
                ['stroke', 'filling', 'shadow', 'insetShadow'].forEach((key) => {
                    if (!effect[key]) return;

                    // 添加 $linkIndex 以避免调节时同色合并问题
                    const linkIndex = aggregatedColors.findIndex((aggregatedColor) => {
                        return tinycolor.equals(effect[key].color, aggregatedColor);
                    });

                    if (linkIndex > -1) {
                        effect[key].$linkIndex = linkIndex;
                    }
                });
            });
        },
        toThreeText(currentEle, elemData, material = {}) {
            const { content } = currentEle;

            // 旧方案清理，新方案用 metaInfo.materials
            delete currentEle.materialId;

            if (content.length > this.maxThreeLength) {
                this.$emit('invalid', `仅支持${this.maxThreeLength}个字`);
            }

            const hasUnsupportChar = (content) => {
                if (
                    !this.editor.$threeTextRenderer ||
                    !this.editor.$threeTextRenderer.font ||
                    !this.editor.$threeTextRenderer.font.data.supportedGlyphs
                ) {
                    return;
                }
                content = content.replace(/\u200b/, '');
                const chars = content.split('');
                const supportList = this.editor.$threeTextRenderer.font.data.supportedGlyphs;
                return chars.some((char) => {
                    return !supportList.includes(char);
                });
            };
            if (hasUnsupportChar(content)) {
                this.$emit('invalid', '不支持特殊字符');
            }

            if (/vertical-[lr]{2}/.test(currentEle.writingMode)) {
                this.$emit('invalid', '不支持竖排');
            }

            // 处理 metaInfo.materials
            this.removeTextMaterial(currentEle);

            const data = defaults(
                {
                    rotate3d: currentEle.rotate3d,
                    hemiLight: {
                        enable: false,
                        dir: [0, 0, 1],
                        strength: 1,
                        color: '#ffffff',
                    },
                    category: currentEle.category,
                    animations: currentEle.animations,
                    metaInfo: currentEle.metaInfo,
                },
                pick(elemData, [
                    'type',
                    // 'fontFamily',
                    'layers',
                    'rotate3d',
                    'pointLights',
                    'viewAngle',
                    'environment',
                    'hemiLight',
                    'isFloodLightOff',
                    'textAlign',
                    'lock',
                ]),
            );

            if (currentEle.type === 'threeText') {
                if (material.id) {
                    materialMeta.addElementMaterialMeta(currentEle, {
                        id: material.id,
                        type: materialMeta.THREE_TEXT,
                        fromUser: true,
                    });
                }
                const layer = data.layers[0];
                ['frontMaterials', 'bevelMaterials', 'sideMaterials'].forEach((key) => {
                    if (
                        layer[key] &&
                        layer[key].normalDisable === undefined &&
                        layer[key].normalStrength &&
                        /^http/.test(layer[key].normal)
                    ) {
                        layer[key].normalDisable = false;
                    }
                });
                if (data.isFloodLightOff === undefined) {
                    data.isFloodLightOff = !(
                        data.pointLights.some((pointLight) => pointLight.enable) ||
                        data.hemiLight.enable
                    );
                }
                this.editor.changeElement(data, currentEle);
            } else {
                const textElem = this.toNormalText(currentEle);
                Object.assign(
                    data,
                    pick(textElem, [
                        'left',
                        'top',
                        'width',
                        'height',
                        'fontSize',
                        'fontFamily',
                        'transform',
                        'content',
                        'contents',
                        'linkId',
                        'textAlign',
                        'letterSpacing',
                        'lock',
                    ]),
                );

                // 将 3d 样式的颜色设置为文字颜色，同时避免设置白色
                const { frontMaterials, sideMaterials, bevelMaterials } = data.layers[0];
                const materials = [frontMaterials, sideMaterials, bevelMaterials];
                let color = '#000';
                for (let i = 0; i < materials.length; i++) {
                    if (!materials[i]) continue;
                    const materialColor = tinycolor(materials[i].albedo.color);
                    if (materialColor.toHex() === 'ffffff') {
                        color = materialColor.toHexString();
                        break;
                    }
                }
                data.contents.forEach((content) => {
                    content.color = color;
                });
                const elem = this.editor.createElement(data);
                // 保持uuid 不变
                elem.uuid = textElem.uuid;

                if (material.id) {
                    materialMeta.addElementMaterialMeta(elem, {
                        id: material.id,
                        type: materialMeta.THREE_TEXT,
                        fromUser: true,
                    });
                }
                this.replaceElement(textElem, elem);
            }
        },
        toStyledText(currentEle, elemData) {
            const data = pick(currentEle, [
                'width',
                'height',
                'top',
                'left',
                'fontSize',
                'textAlign',
                'fontFamily',
                'content',
                'color',
                'writingMode',
                'resize',
                'linkId',
                'lock',
            ]);

            let effectFontId = this.effectFontId;
            let fontFamily = currentEle.fontFamily;
            if (!elemData.effect_fonts.some((ef) => ef.id === effectFontId)) {
                // 特效不支持当前的字体时，切换到支持的第一个字体
                const effectFont = elemData.effect_fonts[0];
                effectFontId = effectFont.id;
                fontFamily = this.editor.options.fontList.find(
                    (f) => f.id === effectFont.font_id,
                ).name;
            }

            merge(data, {
                type: 'styledText',
                fontFamily,
                effectStyle: {
                    id: elemData.id,
                    effectFontId,
                    name: elemData.name,
                },
            });

            if (currentEle.type === 'styledText') {
                this.editor.changeElement(data, currentEle);
            } else {
                const rotate = currentEle.rotate;
                const elem = this.editor.createElement(data);
                elem.rotate = rotate;

                this.replaceElement(currentEle, elem);
            }
        },
        // 应用元素的默认特效
        applyDefaultEffect() {
            const curElem = this.elem;
            this.$emit('change', null);
            if (this.isSelector) {
                curElem.elements.forEach((element) => {
                    this.applyElemDefaultEffect(element);
                });
            } else {
                this.applyElemDefaultEffect(curElem);
            }
            curElem.textEffects = [];
            curElem.imageEffects = [];
            curElem.shadows = [];
        },
        applyElemDefaultEffect(curElem) {
            const elemData = {
                imageEffects: [],
                textEffects: [],
                shadows: [],
            };

            if (curElem.type === 'text' || curElem.type === 'effectText') {
                this.applyTextEffect(curElem, elemData);
            } else if (curElem.type === 'threeText' || curElem.type === 'styledText') {
                this.toNormalText(curElem);
            } else if (curElem.type === 'image' || curElem.type === 'mask') {
                this.applyImageEffect(curElem, elemData);
            }

            curElem.$effectPreviewUrl = null;
        },
        // 图片特效渲染前监听回调
        onImageEffectRenderBefore(model, canvas) {
            canvas.toBlob((blob) => {
                if (blob.size === this.lastBaseImageSize) return;
                this.lastBaseImageSize = blob.size;
                this.uploadService.uploadImage(blob);
            });
        },
    },
};
</script>

<style lang="less">
.eui-v2-editor-text-effects {
    position: relative;

    .eui-v2-editor-effects-preview {
        position: absolute;
        height: 44px;
        width: 44px;
        top: 14px;
        left: 12px;
        background: #fff;
        border-radius: 4px;

        p {
            margin-bottom: 0;
        }
    }
}
</style>
