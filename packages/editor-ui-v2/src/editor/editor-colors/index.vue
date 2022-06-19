<template>
    <div class="eui-v2-editor-colors">
        <EditorColorPanel
            :colors="colors"
            :map-presets="maps"
            :material="threeMaterials"
            :material-presets="materials"
            :type="isThreeText ? 'text' : ''"
            :enable-preset="enablePreset"
            :preset-type="isThreeText ? 'material' : 'color'"
            :preset-colors="presetInfo && presetInfo.items"
            :preset-label="presetInfo && presetInfo.name"
            :format="isText ? 'hex8' : 'hex'"
            :multiple="colorsStatus.multiple"
            :disabled="colorsStatus.disabled || disabled"
            :cmyk-mode="cmykMode"
            :gradient-max-stop="isText ? Infinity : 4"
            :gradient-enable-alpha="isText"
            :enable-alpha="isText"
            :editor="editor"
            :showStraw="enableStraw"
            :strawActivated.sync="strawActivated"
            :normal-map="normalMap"
            :normal-map-presets="threeTextNormals"
            :three-mode="threeMode"
            :design-mode="designMode"
            :options="options"
            ossResizeUrl
            @change="onColorsChange"
            @click-straw="clickStraw"
            @change-visible="onChangeVisible"
            @preset-click="onPresetClick"
            @change-current-color="onChangeCurrent"
        />
    </div>
</template>

<script>
import Vue from 'vue';
import tinycolor from 'tinycolor2';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import { EditorColorPanel } from '../../index';
import { angleToVec, vecToAngle, FACE_XY, FACE_XZ } from './angle-vec-conversion';
import { getPresetColorRules } from './preset-color-rules';
import strawMixin from '../../utils/editor-straw-mixin';
import { i18n } from '../../i18n';
import { updateEffect } from '@gaoding/editor-utils/effect/browser/effect-actions';

const state = Vue.observable({ userImages: [] });
const faceMap = [FACE_XY, FACE_XZ];
const THREE_TEXT = 'threeText';
const TEXT = 'text';
const EFFECTTEXT = 'effectText';
const STYLED_TEXT = 'styledText';
const IMAGE = 'image';
const MASK = 'mask';
const WATERMARK = 'watermark';
const FRONT = 'front';
const SIDE = 'side';
const BEVEL = 'bevel';

function getMaterialColors(materials) {
    const albedo = materials.albedo;
    if (albedo.type === 0) {
        return albedo.color;
    } else if (albedo.type === 1) {
        return {
            image: albedo.image,
            scale: materials.scale,
            x: albedo.texTranslate[0],
            y: albedo.texTranslate[1],
            rotage: albedo.texRotateAngle,
            minScale: 0.5,
            maxScale: 3,
        };
    } else if (albedo.type === 2) {
        return {
            angle: vecToAngle(albedo.gradient.direction, faceMap[albedo.gradient.face]),
            stops: albedo.gradient.stops,
            face: albedo.gradient.face,
        };
    }
}

export default {
    components: {
        EditorColorPanel,
    },
    mixins: [strawMixin],
    inject: {
        teamService: {
            type: Object,
            default() {
                return null;
            },
        },
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        enablePreset: {
            type: Boolean,
            default: true,
        },
        twoMapPresets: {
            type: Array,
            default: () => [],
        },
        threeTextResources: {
            type: Object,
            default: () => ({}),
        },
        webglSupport: {
            type: Boolean,
            default: true,
        },
        getMaterial: {
            type: Function,
            default: () => {},
        },
        uploadImage: {
            type: Function,
            default: () => {
                throw new Error('需要实现图片上传');
            },
        },
        enableStraw: {
            type: Boolean,
            default: false,
        },
        designMode: {
            type: Boolean,
            default: false,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        disabledPresetColors: {
            type: Boolean,
            defualt: false,
        },
        editApply: {
            type: Function,
            default: () => () => {},
        },
    },
    data() {
        return {
            currentColor: null,
            currentIndex: -1,
            normalMapType: 'basic',
            normalMapEnbale: false,
        };
    },
    computed: {
        options() {
            const { teamService } = this;
            return {
                teamService,
            };
        },
        elem() {
            return (
                this.editor.currentCropElement ||
                this.editor.currentEditMask ||
                this.editor.currentSubElement ||
                this.editor.currentElement ||
                {}
            );
        },
        elements() {
            return this.isSelector ? this.editor.currentElement.elements : [this.elem];
        },
        threeMode() {
            return this.elements.some((elem) => elem.type === THREE_TEXT);
        },
        tabs() {
            const currentColor = this.currentColor;
            let tabs = ['color'];
            if (this.isThreeText) {
                tabs.push('gradient', 'map', 'team');
            }
            // 当前色为渐变
            else if (currentColor && currentColor.tab === 'gradient') {
                tabs = [
                    {
                        name: i18n.$tsl('渐变'),
                        value: 'gradient',
                    },
                ];
            } else if (currentColor && currentColor.tab === 'map') {
                tabs = [
                    {
                        name: i18n.$tsl('图案'),
                        value: 'map',
                    },
                ];
            } else {
                tabs.push('team');
            }
            return tabs;
        },
        colors() {
            const elem = this.elements[0];
            return this.getColors(elem);
        },
        maps() {
            if (this.isThreeText) {
                return this.threeTextTextures.map((info) => ({
                    ...info,
                    images: state.userImages.concat(info.images),
                }));
            }

            return this.twoMapPresets;
        },
        materials() {
            if (this.isThreeText) {
                return this.threeTextMaterials;
            }

            return null;
        },
        presetInfo() {
            if (this.disabledPresetColors) {
                return null;
            }
            if (this.isThreeText) {
                return {
                    name: '',
                    items: [],
                };
            }

            if (!this.elements.length) {
                return {
                    name: '',
                    items: [],
                };
            }

            const elem = this.elements[0];
            const length = elem.mainColor ? 1 : Math.max(1, this.colors.length);
            const diffColor = this.elements.some((element) => {
                const _length = element.mainColor ? 1 : Math.max(1, this.getColors(element).length);
                return length !== _length;
            });

            if (diffColor) {
                return {
                    name: '',
                    items: [],
                };
            }

            return getPresetColorRules(length);
        },
        colorsStatus() {
            const status = {
                disabled: false,
                multiple: false,
            };
            if (this.isSelector) {
                if (
                    this.elements.every(
                        (element) =>
                            element.type === TEXT &&
                            (!element.textEffects || !element.textEffects.length),
                    )
                ) {
                    const colors = this.elements.map(this.getColors);
                    status.disabled = colors.some((color) => color.length > 1);
                    status.multiple =
                        this.editor.currentSelection && this.editor.currentSelection.colorMixed;
                } else {
                    status.disabled = true;
                }
            } else if (this.isText) {
                status.multiple =
                    this.editor.currentSelection && this.editor.currentSelection.colorMixed;
            } else if (this.isThreeText && !this.webglSupport) {
                status.disabled = true;
            }

            return status;
        },
        threeTextMaterials() {
            return this.threeTextResources.threeTextMaterials || [];
        },
        threeTextTextures() {
            return this.threeTextResources.threeTextTextures || [];
        },
        threeTextNormals() {
            return this.threeTextResources.threeTextNormals || [];
        },
        isThreeText() {
            return this.elements.some((element) => element.type === THREE_TEXT);
        },
        isStyledText() {
            return this.elements.some((element) => element.type === STYLED_TEXT);
        },
        isText() {
            return this.elements.some((element) => element.type === TEXT);
        },
        isSelector() {
            const { currentElement } = this.editor;
            return currentElement && currentElement.type === '$selector';
        },
        threeMaterials() {
            const { currentIndex, elem, getThreeTextColorTypes } = this;
            const types = getThreeTextColorTypes(elem);
            if (elem.layers && currentIndex !== -1) {
                const layer = elem.layers[0];
                switch (types[currentIndex]) {
                    case FRONT:
                        return layer.frontMaterials;
                    case BEVEL:
                        return layer.bevelMaterials;
                    case SIDE:
                        return layer.sideMaterials;
                }
            }
            return {};
        },
        threeAlbedo() {
            return this.threeMaterials.albedo;
        },
        normalMap() {
            const { threeMaterials, normalMapEnbale, threeTextNormals } = this;

            if (!threeMaterials.normalStrength && threeTextNormals.length > 0) {
                const normal = threeTextNormals[0];
                this.normalMapType = normal.value; // eslint-disable-line
                threeMaterials.normal = normal.images[0];
            }

            return {
                type: this.normalMapType,
                image: threeMaterials.normal,
                enabled: normalMapEnbale || Boolean(threeMaterials.normalStrength),
                strength: threeMaterials.normalStrength,
            };
        },
    },
    methods: {
        getColors(element) {
            switch (element.type) {
                case THREE_TEXT:
                    return this.getThreeTextColors(element);
                case STYLED_TEXT:
                    return this.getStyledTextColors(element);
                case EFFECTTEXT:
                case TEXT:
                    return this.getTextAndImageColors(element);
                case IMAGE:
                case MASK:
                    return this.getTextAndImageColors(element);
                case WATERMARK:
                    return this.getWatermarkColors(element);
                default:
                    return [];
            }
        },
        getWatermarkColors(element) {
            return element.aggregatedColors.map((color) => color.color);
        },
        getThreeTextColors(element) {
            const layer = element.layers[0];
            const colors = [];
            colors.push(getMaterialColors(layer.frontMaterials));
            if (layer.bevelMaterials.enable) {
                colors.push(getMaterialColors(layer.bevelMaterials));
            }
            if (layer.sideMaterials.enable) {
                colors.push(getMaterialColors(layer.sideMaterials));
            }

            return colors;
        },
        getThreeTextColorTypes(element) {
            if (!element.layers) {
                return [];
            }
            const layer = element.layers[0];
            const types = [];
            types.push(FRONT);
            if (layer.bevelMaterials.enable) {
                types.push(BEVEL);
            }
            if (layer.sideMaterials.enable) {
                types.push(SIDE);
            }
            return types;
        },
        getDefaultColors(element) {
            let colors = null;
            const { mainColor, aggregatedColors, color } = element;

            if (mainColor) {
                colors = mainColor;
            } else if (aggregatedColors.length && this.isElementEffected(element)) {
                colors = aggregatedColors;
            } else if (this.editor.currentSelection) {
                colors = this.editor.currentSelection.color;
            } else {
                colors = color;
            }

            return [].concat(colors).filter((color) => !!color);
        },
        hasEffectColor(element) {
            return (
                element &&
                (element.mainColor ||
                    (element.aggregatedColors && element.aggregatedColors.length) ||
                    element.color)
            );
        },
        isFillingImageOrGradient(element) {
            const { textEffects } = element;
            return (
                textEffects &&
                textEffects.length > 0 &&
                textEffects.some(
                    (effect) =>
                        effect.filling && [1, 2, 'image', 'gradient'].includes(effect.filling.type),
                )
            );
        },
        onColorsChange(color) {
            this.editApply();

            const rColor =
                typeof color === 'string'
                    ? {
                          data: color,
                          index: this.currentIndex,
                          type: this.currentColor.tab,
                      }
                    : color;

            if (rColor.index === undefined) {
                rColor.index = this.currentIndex;
            }
            this.$emit('change', rColor);
            this.elements.forEach((element) => {
                this.changeElementColors(element, rColor);
            });
        },
        changeElementColors(element, { index, data, type }) {
            if (element.type === THREE_TEXT) {
                this.changeThreeTextColors(element, { index, data, type });
            } else if (element.type === STYLED_TEXT) {
                this.changeStyledTextColors(element, { data, type });
            } else if (element.type === TEXT || element.type === EFFECTTEXT) {
                this.changeTextAndImageColors(element, data, index);
            } else if (element.type === IMAGE || element.type === MASK) {
                this.changeTextAndImageColors(element, data, index);
            } else if (element.type === WATERMARK) {
                this.changeWatermarkColors(element, { index, data, type });
            } else {
                this.changeDefaultColors(data, index);
            }
        },
        changeWatermarkColors(element, { index, data, type }) {
            const color = element.aggregatedColors[index];
            this.editor.changeElement(
                {
                    color: {
                        [color.key]: data,
                    },
                },
                element,
            );
        },
        changeDefaultColors(color, idx) {
            color = tinycolor(color.hex || color).toHex8String();

            const { editor, isElementEffected } = this;
            let elements = [];
            const { currentSubElement, currentElement } = this.editor;
            if (currentElement && currentElement.type === '$selector') {
                // 多选情况目前只支持对文字单颜色操作
                elements = currentElement.elements.filter((element) => {
                    if (element.type !== 'text' && element.type !== 'effectText') {
                        return;
                    }
                    if (!isElementEffected(element)) {
                        return true;
                    }

                    return (
                        this.hasEffectColor(element) &&
                        !this.isFillingImageOrGradient(element) &&
                        (element.mainColor || element.aggregatedColors.length === 0)
                    );
                });
            } else {
                const element = currentSubElement || currentElement;

                elements =
                    element &&
                    ['image', 'text', 'effectText', 'styledText', 'mask'].includes(element.type) &&
                    this.hasEffectColor(element) &&
                    !this.isFillingImageOrGradient(element)
                        ? [element]
                        : [];
            }

            // 对于多选的时候，需要判断每个选择的文字是修改color、mainColor，同时对于 aggregatedColors 不做修改
            elements.forEach((element) => {
                const index = element.mainColor ? undefined : idx;
                if (isElementEffected(element)) {
                    editor.$events.$emit('element.applyEdit', element);
                    editor.changeEffectColor(color, index, element);
                } else {
                    editor.changeElement({ color }, element);
                }
            });
        },
        changeThreeTextColors(element, { data, type }) {
            if (!this.webglSupport) {
                return;
            }

            const albedo = this.threeAlbedo;
            const materials = this.threeMaterials;

            if (!albedo && type !== 'material-preset') {
                return;
            }

            let promise = Promise.resolve();
            if (type === 'color') {
                albedo.color = data;
                albedo.type = 0;
            } else if (type === 'map') {
                albedo.image = data.image;
                materials.scale = data.scale;
                albedo.type = 1;
                albedo.texTranslate = [data.x, data.y];
                albedo.texRotateAngle = data.rotate;
            } else if (type === 'material') {
                materials.roughnessStrength = data.roughnessStrength;
                materials.metalStrength = data.metalStrength;
                if (this.normalMap.enabled) {
                    materials.normalStrength = data.normalStrength;
                    this.lastNormalStrength = materials.normalStrength;
                }
                materials.scale = data.scale;
            } else if (type === 'material-preset') {
                const currentCategory = this.threeTextMaterials.find(
                    (materialInfo) => materialInfo.value === data.type,
                );
                const materialIndex = currentCategory.images.indexOf(data.value);
                promise = promise
                    .then(() => {
                        return this.getMaterial(currentCategory.ids[materialIndex]);
                    })
                    .then((materialModel) => {
                        const elementData = materialModel.data.model;
                        elementData.layers.forEach((layer, layerIdx) => {
                            ['frontMaterials', 'sideMaterials'].forEach((key) => {
                                merge(element.layers[layerIdx][key], layer[key]);
                            });
                        });
                        merge(element.environment, elementData.environment);
                        merge(element.pointLights, elementData.pointLights);
                    });
            } else if (type === 'gradient') {
                const { gradient } = albedo;
                albedo.type = 2;
                gradient.face = data.face;
                gradient.direction.splice(0, 3, ...angleToVec(data.angle, faceMap[gradient.face]));
                gradient.stops = data.stops;
            } else if (type === 'normalMap') {
                this.normalMapType = data.type;
                this.normalMapEnbale = data.enabled;
                materials.normal = data.image;
                materials.normalStrength = data.enabled ? this.lastNormalStrength : 0;
            }

            promise.then(() => {
                this.editor.makeSnapshotByElement(element);
            });
        },
        isElementEffected(element) {
            const { textEffects, imageEffects, shadows, aggregatedColors } = element;
            return (
                ((textEffects && textEffects.length > 0) ||
                    (imageEffects && imageEffects.length > 0) ||
                    (shadows && shadows.length > 0)) &&
                aggregatedColors &&
                aggregatedColors.length > 0
            );
        },
        onPresetClick(colors) {
            this.editApply();

            // 只有单选的情况下支持预设

            const element = this.elem;
            this.colors.forEach((color, i) => {
                if (typeof color.effectIndex === 'number') {
                    const textEffect = element.textEffects[color.effectIndex];
                    if (textEffect.filling) {
                        textEffect.filling.type = 'color';
                        textEffect.filling.color = colors[i];
                        textEffect.filling.$linkIndex = i;
                    }
                }
            });
            colors.forEach((color, colorIdx) => {
                if (element.type === TEXT || element.type === EFFECTTEXT) {
                    this.changeTextAndImageColors(element, color, colorIdx, 'preset');
                } else if (element.type === 'watermark') {
                    this.changeWatermarkColors(element, {
                        index: colorIdx,
                        data: color,
                        action: 'preset',
                    });
                } else {
                    this.changeDefaultColors(color, colorIdx, true);
                }
            });
        },
        getStyledTextColors(element) {
            return [element.color];
        },
        getTextAndImageColors(element) {
            let colors = [];
            const {
                mainColor,
                aggregatedColors,
                color,
                textEffects,
                imageEffects,
                shadows,
                $linkIndex,
            } = element;
            if (mainColor) {
                colors = [mainColor];
                return colors;
            } else if (!this.elem.$editing && this.isElementEffected(element)) {
                colors = [...aggregatedColors];
            } else if (this.editor.currentSelection && this.editor.currentSelection.color) {
                colors[$linkIndex || 0] = this.editor.currentSelection.color;
            } else {
                colors[$linkIndex || 0] = color;
            }

            // 由于 aggregatedColors 在直接修改文字特效颜色时不会主动更新，所以这边需要聚合多个文字效果，不使用 aggregatedColors
            let hasFillGradientOrImage = false;
            (textEffects || imageEffects).forEach((effect, i) => {
                if (!effect.enable) return;

                if (effect.filling && effect.filling.enable) {
                    if (effect.filling.type === 0 || effect.filling.type === 'color') {
                        colors[effect.filling.$linkIndex] = effect.filling.color;
                    } else if (
                        (effect.filling.type === 2 || effect.filling.type === 'gradient') &&
                        effect.filling.gradient.enable !== false
                    ) {
                        const gradient = cloneDeep(effect.filling.gradient);
                        gradient.effectIndex = i;
                        colors.push(gradient);
                        hasFillGradientOrImage = true;
                    } else if (
                        (effect.filling.type === 1 || effect.filling.type === 'image') &&
                        effect.filling.imageContent.enable !== false
                    ) {
                        colors.push({
                            image: effect.filling.imageContent.image,
                            scale: effect.filling.imageContent.scaleX,
                            type: effect.filling.imageContent.type,
                            effectIndex: i,
                            width: effect.filling.imageContent.width,
                            height: effect.filling.imageContent.height,
                        });
                        hasFillGradientOrImage = true;
                    }
                }
                if (effect.stroke && effect.stroke.enable) {
                    colors[effect.stroke.$linkIndex] = effect.stroke.color;
                }
                if (effect.insetShadow && effect.insetShadow.enable) {
                    colors[effect.insetShadow.$linkIndex] = effect.insetShadow.color;
                }
            });

            (shadows || []).forEach((shadow) => {
                if (shadow.enable) {
                    colors[shadow.$linkIndex] = shadow.color;
                }
            });

            if (textEffects && hasFillGradientOrImage && aggregatedColors.length === 0) {
                colors.shift();
            }

            return colors.filter((v) => v);
        },
        changeStyledTextColors(element, { data }) {
            this.editor.changeElement(
                {
                    color: data,
                },
                element,
            );
        },
        changeTextAndImageColors(element, data, idx, action) {
            this.editApply();

            let color = data.hex || data;
            color = this.colorToHexa(color);
            const {
                editor,
                isElementEffected,
                hasEffectColor,
                isFillingImageOrGradient,
                changeImageContentEffect,
                changeGradientEffect,
                currentColor,
            } = this;

            if (this.isSelector) {
                if (element.type !== TEXT && element.type !== EFFECTTEXT) {
                    return;
                }
                if (isElementEffected(element)) {
                    return;
                }
                if (
                    hasEffectColor(element) &&
                    !isFillingImageOrGradient(element) &&
                    (element.mainColor || element.aggregatedColors.length === 0)
                ) {
                    return;
                }
            } else {
                const isGradient =
                    currentColor &&
                    currentColor.gradient &&
                    currentColor.gradient.effectIndex !== undefined;
                const isMap =
                    currentColor && currentColor.map && currentColor.map.effectIndex !== undefined;

                // 修改渐变填充
                if (
                    [TEXT, EFFECTTEXT, MASK, IMAGE].includes(element.type) &&
                    isGradient &&
                    action !== 'preset'
                ) {
                    changeGradientEffect(element, data, currentColor.gradient.effectIndex);
                    return;
                }
                // 修改图案填充
                else if (
                    [TEXT, EFFECTTEXT, MASK, IMAGE].includes(element.type) &&
                    isMap &&
                    action !== 'preset'
                ) {
                    changeImageContentEffect(element, data, currentColor.map.effectIndex);
                    return;
                }

                if (
                    !(
                        [TEXT, EFFECTTEXT, MASK, IMAGE].includes(element.type) &&
                        this.hasEffectColor(element)
                    )
                ) {
                    return;
                }
            }
            // 对于多选的时候，需要判断每个选择的文字是修改color、mainColor，同时对于aggregatedColors不做修改
            const index = element.mainColor ? undefined : idx;
            if (isElementEffected(element)) {
                editor.$events.$emit('element.applyEdit', element);
                editor.changeEffectColor(color, index, element);
            } else {
                editor.changeElement({ color }, element);
            }
        },
        colorToHexa(color) {
            return tinycolor(color).toHex8String();
        },
        onChangeCurrent(color, index) {
            this.currentColor = color;
            this.currentIndex = index;
        },
        changeGradientEffect(element, options, index) {
            const effect = element[element.textEffects ? 'textEffects' : 'imageEffects'][index];

            updateEffect(effect, {
                filling: {
                    enable: true,
                    type: 'gradient',
                    gradient: {
                        angle: options.angle,
                        stops: options.stops,
                    },
                },
            });
        },
        changeImageContentEffect(element, options, index) {
            this.editApply();

            let effect;
            let repeat = options.repeat === undefined ? 1 : options.repeat;
            const isText = ['text', 'effectText'].includes(element.type);
            if (isText) {
                effect = element.textEffects[index];
            } else {
                effect = element.imageEffects[index];
                repeat = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'][repeat] || 'repeat';
            }
            updateEffect(
                effect,
                {
                    filling: {
                        enable: true,
                        type: 'image',
                        imageContent: {
                            height: options.height,
                            width: options.width,
                            scaleX: options.scale,
                            scaleY: options.scale,
                            image: options.image,
                            repeat,
                            type: options.type,
                        },
                    },
                },
                false,
            );
        },
        onChangeVisible(visible) {
            this.$emit('change-visible', visible);
        },
    },
};
</script>
