<template>
    <div class="eui-v2-image-control">
        <Button
            class="eui-v2-image-control-button"
            :class="{ 'is-full': isGif }"
            tooltip=""
            tooltip-side="bottom"
            icon-type="left"
            fill="clear"
            block
            :disabled="isCrop || disabled || isSelector"
            @click="crop"
        >
            <Icon name="images-tool-img_tailor" />
            {{ $tsl('裁剪') }}
        </Button>
        <Button
            v-if="!isGif"
            class="eui-v2-image-control-button"
            :class="disabledClass"
            tooltip=""
            tooltip-side="bottom"
            icon-type="left"
            fill="clear"
            block
            :disabled="disabled || isSelector"
            @click="showImageFilter"
        >
            <Icon name="images-tool-img_adjust" />
            {{ $tsl('滤镜') }}
        </Button>
        <Button
            v-if="!isGif && !hideMatting"
            class="eui-v2-image-control-button"
            tooltip=""
            tooltip-side="bottom"
            icon-type="left"
            fill="clear"
            block
            :disabled="disabled || mattingDisabled || isSelector"
            :disabled-tooltip="mattingDisabled ? $tsl('会员专享素材暂不支持抠图') : ''"
            @click="editApply(), onMatting()"
        >
            <Icon name="images-tool-img_cutout" />
            <div>
                {{ mattingText }}
                <div
                    v-if="!hideChargeLimit"
                    :class="[
                        'eui-v2-image-control-button__tip',
                        'eui-v2-image-control-button__matting-tip',
                    ]"
                >
                    <span class="eui-v2-image-control-button__tip-text">{{ $tsl('限免') }}</span>
                </div>
            </div>
        </Button>
        <Button
            v-if="!isGif && onImageEdit && !$isTablet"
            class="eui-v2-image-control-button"
            :class="disabledClass"
            tooltip=""
            tooltip-side="bottom"
            icon-type="left"
            fill="clear"
            block
            :disabled="disabled || mattingDisabled || isSelector"
            :disabled-tooltip="mattingDisabled ? $tsl('会员专享素材暂不支持美化图片') : ''"
            @click="imageEdit"
        >
            <Icon name="images-tool-img_beautify" />
            {{ $tsl('美化') }}
        </Button>
    </div>
</template>

<script>
import { inject, ref, computed } from '@vue/composition-api';
import Icon from '../base/icon';
import Button from '../base/button';
import { get } from 'lodash';
import { i18n } from '../i18n';
import { EDITOR_UI_PROVIDER_KEY, defaultConfig } from '../base/config-provider/provide';

export default {
    components: {
        Icon,
        Button,
    },
    props: {
        editor: { type: Object, required: true },
        onMatting: { type: Function, required: true },
        onImageEdit: { type: Function, default: null },
        isTipShow: { type: Boolean, required: false },
        disabled: { type: Boolean, default: false },
        isNew: { type: Boolean, default: false },
        mattingDisabled: { type: Boolean, default: true },
        hideMatting: { type: Boolean, default: false },
        hideChargeLimit: { type: Boolean, default: true },
        showImageFilter: { type: Function, default: () => {} },
    },
    setup() {
        const config = inject(EDITOR_UI_PROVIDER_KEY, ref(defaultConfig));
        return {
            disabledClass: computed(() =>
                !config.value.enableImagePanelStylePart ? config.value.stylePartyDisabledClass : '',
            ),
        };
    },
    computed: {
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement;
        },
        isCrop() {
            return this.elem.type === '$croper' || this.elem.type === '$masker';
        },
        isSelector() {
            const { elem } = this;
            return elem && elem.type === '$selector';
        },
        isGif() {
            const editor = this.editor;
            const isGif = (elem) => elem && (elem.isGif || elem.isApng || elem.isVideo);
            const elements = this.isSelector ? editor.currentElement.elements : [this.elem];
            return (
                elements.some((elem) => {
                    return isGif(elem);
                }) ||
                isGif(editor.currentCropElement) ||
                isGif(editor.currentEditMask)
            );
        },
        mattingText() {
            const matting = get(this.elem, 'metaInfo.thirdParty.matting', {});
            return matting.workId && matting.url !== this.elem.url
                ? i18n.$tsl('编辑抠图')
                : i18n.$tsl('抠图');
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        editApply() {
            this.isCrop && this.editor.$events.$emit('element.editApply', this.elem);
        },
        crop() {
            this.editor.showElementEditor(this.elem);
            this.$emit('click-crop');
        },

        imageEdit() {
            this.editApply();
            this.onImageEdit(this.elem);
        },
    },
};
</script>

<style lang="less">
.eui-v2-image-control {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-bottom: -10px;

    &-button {
        position: relative;
        flex-basis: calc(50% - 6px);
        flex-grow: 1;
        padding: 10px;
        margin-bottom: 12px;
        background: #f6f7f9;
        border-radius: 4px;

        &:nth-child(odd) {
            margin-right: 12px;
        }
        &:last-child {
            margin-right: 0;
        }

        .eui-v2-icon {
            margin-right: 8px;
            font-size: 18px;
        }

        &:hover {
            background: #e8eaec;
        }

        &:disabled {
            .eui-v2-icon {
                color: @disabled-color;
            }
        }

        &__tip {
            position: absolute;
            right: 0;
            top: 0;
            font-weight: 600;
            color: #23b360;
            background: #edf7ef;
            border-radius: 0px 2px 0px 8px;
            transform: scale(0.714);
            transform-origin: top right;
            padding: 2px 12px;

            &-text {
                display: inline-block;
                font-size: 14px;
            }
        }

        .eui-v2-button__tooltip--bottom {
            width: 100px;
            white-space: normal;
        }

        &:disabled,
        &[disabled] {
            .eui-v2-image-control-button__tip {
                opacity: 0.5;
            }
        }

        &.is-full {
            flex-basis: auto;
            margin-bottom: 22px;
        }

        &__matting-tip {
            line-height: 12px;
        }
    }
}
</style>
