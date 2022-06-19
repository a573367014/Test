<template>
    <DropDownButton
        class="eui-v2-dropdown-effects"
        placement="bottom-center"
        type="grey"
        :classes="classes"
        :fill="fill"
        :appendBody="false"
        :as-ref-width="false"
        :disabled="disabled"
        @onShow="(val) => (editor.options.scopePointerEventsEnable = !val)"
        :showAngleDownIcon="!!effectPreview"
        @active="$emit('active', $event)"
        @inactive="$emit('inactive', $event)"
        block
    >
        <slot name="preview">
            <div class="eui-v2-dropdown-effect-preview" :class="innerClass">
                <div class="eui-v2-dropdown-effect-preview-show" :style="previewStyle"></div>
                <div class="eui-v2-dropdown-effect-preview-text">{{ previewText }}</div>
            </div>
        </slot>
        <slot name="previewEffect" />

        <template #suffix-icon>
            <Icon v-if="shouldShowDownIcon" name="arrow-down" />
            <i v-else></i>
        </template>

        <template #dropdown="dropdown">
            <EffectsPanel
                :panelTitle="panelTitle"
                :tooltip="tooltip"
                :effects="effects"
                :init-tab="currentTab"
                :current-effect="currentEffects[0]"
                :supportNomarl="supportNomarl"
                @change="onSelectEffect($event, dropdown)"
                @hover-change="$emit('hover-change', $event)"
                @clear="clearEffect($event, dropdown)"
            >
                <slot slot="clear" name="clear" />
            </EffectsPanel>
        </template>
    </DropDownButton>
</template>

<script>
import Icon from '../../base/icon';

import EffectsPanel from './effects-panel';
import DropDownButton from '../../base/dropdown-button';
import { isEqual, uniq, get } from 'lodash';
import { i18n } from '../../i18n';

export default {
    components: {
        Icon,
        EffectsPanel,
        DropDownButton,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        panelTitle: {
            type: String,
            default: '',
        },
        effects: {
            type: Object,
            default: () => ({}),
        },
        currentEffect: {
            type: [Object, Array],
            default: () => [],
        },
        classes: {
            type: String,
            default: '',
        },
        autoClose: {
            type: Boolean,
            default: true,
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
        tooltip: {
            type: Boolean,
            default: false,
        },
        emptyTip: {
            type: String,
            default: i18n.$tsl('添加特效'),
        },
        supportNomarl: {
            type: Boolean,
            default: true,
        },
        manualShowDownIcon: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || {};
        },
        tabContainFirstEffect() {
            const firstEffect = this.currentEffects[0];
            if (firstEffect) {
                const currentEffects = Object.entries(this.effects).find((value) =>
                    value[1].find((effect) => isEqual(effect, firstEffect)),
                );
                if (currentEffects) {
                    return currentEffects[0];
                }
            }

            return null;
        },
        currentTab() {
            return this.tabContainFirstEffect || this.initTab || Object.keys(this.effects)[0];
        },
        currentEffects() {
            return Array.isArray(this.currentEffect)
                ? this.currentEffect
                : this.currentEffect
                ? [this.currentEffect]
                : [];
        },
        currentValidEffects() {
            return this.currentEffects.filter((effect) => effect);
        },
        uniqEffects() {
            return uniq(this.currentEffects);
        },
        effectPreview() {
            return this.uniqEffects.length > 1
                ? null
                : this.currentEffects[0] && this.currentEffects[0].preview;
        },
        previewStyle() {
            const url = this.effectPreview ? this.effectPreview.url : require('./plus-icon.svg');
            return {
                backgroundImage: url ? `url("${url}")` : null,
                fontSize: this.tabContainFirstEffect && this.effectPreview ? '0' : '20px',
                opacity: this.uniqEffects.length > 1 ? 0 : 1,
                width: this.uniqEffects.length > 1 ? '0px' : '',
            };
        },
        previewText() {
            let text = this.panelTitle || '';
            if (this.uniqEffects.length > 1) {
                text = i18n.$tsl('多种特效...');
            } else if (this.currentValidEffects.length === 0) {
                text = this.emptyTip;
            } else if (!this.tabContainFirstEffect) {
                text = this.panelTitle || i18n.$tsl('默认特效');
            }

            const textEffects = get(this.elem, 'textEffects', []);
            const imageEffects = get(this.elem, 'imageEffects', []);
            const shadows = get(this.elem, 'shadows', []);
            if (textEffects.length || imageEffects.length || shadows.length) {
                text = this.panelTitle;
            }

            return text;
        },
        shouldShowDownIcon() {
            if (!this.editor) return false;
            const textEffectsBool = get(this.elem, 'textEffects', []).some((item) => item.enable);
            const imageEffectsBool = get(this.elem, 'imageEffects', []).some((item) => item.enable);
            const shadowsBool = get(this.elem, 'shadows', []).some((item) => item.enable);
            return textEffectsBool || imageEffectsBool || shadowsBool || this.manualShowDownIcon;
        },
        innerClass() {
            const { clear } = this;
            return {
                'eui-v2-dropdown-effects__clear': clear,
            };
        },
    },
    methods: {
        onSelectEffect(effect, dropdown) {
            this.$emit('change', effect);
            if (dropdown && this.autoClose && !effect.disabled) {
                dropdown.close();
            }
        },
        clearEffect(event, dropdown) {
            this.$emit('clear');
            if (this.autoClose) {
                dropdown.close();
            }
        },
    },
};
</script>

<style lang="less">
.eui-v2-dropdown-effects {
    background: #f6f7f9;
    border-radius: 4px;
    border: none;

    .eui-v2-dropdown-button {
        padding: 12px;
        border: none;

        &.activated,
        &:hover {
            background: #e8eaec;
        }
    }

    .eui-v2-dropdown-effect-preview {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 2px 0;
        background-size: contain;

        &-show {
            width: 44px;
            height: 44px;
            background: #ffffff;
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.04);
            border-radius: 4px;
            font-size: 12px;
        }

        &-text {
            margin-left: 12px;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #33383e;
        }
    }

    .eui-v2-dropdown-button__suffix {
        height: 16px;
        width: 16px;
        right: 16px;
        .eui-v2-icon {
            height: 16px;
            width: 16px;
        }
    }
}
</style>
