<template>
    <div class="editor-color-overlay-wrap">
        <div class="editor-color-overlay">
            <ul class="editor-color-overlay__content">
                <li
                    v-for="(item, i) in colors"
                    @click="changeColor(item)"
                    :class="{
                        'has-border': item === '#FFFFFF' || item === '',
                        'multiple-color': item === 'multiple',
                    }"
                    :style="'background-color:' + item"
                    :key="i"
                >
                    {{ item === '' ? $tsl('原图') : '' }}
                </li>
            </ul>
        </div>

        <div>
            <ColorPickerPanel
                ref="editorColor"
                v-if="colorPickerVisible"
                format="hex8"
                :value="backgroundColor"
                :cmyk-mode="cmykMode"
                :show-straw="enableStraw"
                :straw-activated.sync="strawActivated"
                @click-straw="clickStraw"
                v-click-outside="closePicker"
                @input="changeColor"
            />
        </div>

        <div class="editor-color-overlay__alpha">
            <div class="editor-color-overlay__alpha-value">
                <span>{{ $tsl('叠加强度') }}</span>
                <span class="editor-color-overlay__alpha-value--tip">{{ opacityStr }}</span>
            </div>
            <RangeSlider :max="1" :min="0" :value="1 - opacity" @change="changeOpacity" />
        </div>
    </div>
</template>
<script>
import RangeSlider from '../../base/range-slider';
import ColorPickerPanel from '../../base/color-picker-panel';
import strawMixin from '../../utils/editor-straw-mixin';
import get from 'lodash/get';
import cloneDeep from 'lodash/cloneDeep';
import { i18n } from '../../i18n';

const PRESET_COLORS = [
    '',
    '#000000',
    '#737373',
    '#D9D9D9',
    '#FFFFFF',
    '#A72A2A',
    '#A76E0E',
    '#518625',
    '#191F8A',
    '#49178B',
    '#E65353',
    '#FFD835',
    '#70BC59',
    '#607AF4',
    '#976BEE',
    '#FFECBC',
    '#E9FBBD',
    '#D9DDFF',
    '#F6DEFF',
    '#FFDAE3',
];
export default {
    components: {
        RangeSlider,
        ColorPickerPanel,
    },
    mixins: [strawMixin],
    props: {
        editor: {
            type: Object,
            required: true,
        },
        layout: {
            type: Object,
            default: () => null,
        },
        presetColors: {
            type: Array,
            default: () => null,
        },
        cmykMode: {
            type: Boolean,
            default: false,
        },
        enableStraw: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            colorPickerVisible: false,
        };
    },
    computed: {
        colors() {
            return this.presetColors || PRESET_COLORS;
        },
        curLayout() {
            return this.layout || this.editor.currentLayout;
        },
        backgroundColor() {
            const layout = this.curLayout;
            return (
                get(layout, 'background.gradient') || get(layout, 'background.color', '#00000000')
            );
        },
        backgroundImageInfo() {
            return get(this.curLayout, 'background.image', {
                opacity: 1,
                width: 100,
                height: 100,
                transform: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
            });
        },
        opacity() {
            return this.backgroundImageInfo.opacity === undefined
                ? 1
                : this.backgroundImageInfo.opacity;
        },
        opacityStr() {
            return Math.round((1 - this.opacity) * 100);
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        closePicker(evt) {
            // TODO: popup 内部处理
            if (evt.target.className.includes('eui-v2-dropdown-menu')) {
                return;
            }
            if (this.$refs.editorColor.strawActivated) {
                return;
            }
            // if(this.clickPickerInside) {
            //     this.clickPickerInside = false;
            //     return;
            // }
            setTimeout(() => {
                this.colorPickerVisible = false;
            }, 12);
        },
        changeColor(v) {
            // 原图
            if (v === '') {
                const background = cloneDeep(this.curLayout.background);
                background.image.opacity = 1;
                this.editor.changeLayout({ background }, this.curLayout);
            } else if (v === 'multiple') {
                this.colorPickerVisible = !this.colorPickerVisible;
            }
            // 图片
            else if (typeof v === 'string') {
                const background = cloneDeep(this.curLayout.background);
                background.color = v;
                background.gradent = null;
                background.image.opacity = this.opacity === 1 ? 0.7 : this.opacity;
                this.editor.changeLayout({ background }, this.curLayout);
            }
        },
        changeOpacity(v) {
            const background = cloneDeep(this.curLayout.background);
            background.image.opacity = 1 - v;
            this.editor.changeLayout({ background }, this.curLayout);
        },
    },
};
</script>

<style lang="less">
.editor-color-overlay-wrap {
    .editor-color-overlay {
        &__content {
            padding: 13px 24px 12px 25px;
            display: flex;
            flex-wrap: wrap;
            margin: 0;
            li {
                cursor: pointer;
                box-sizing: border-box;
                list-style: none;
                width: 43px;
                height: 36px;
                margin: 0 2px;
                line-height: 36px;
                text-align: center;
                font-size: 12px;
                color: #000;
                user-select: none;
                border: 1px solid rgba(0, 0, 0, 0.06);
                border-radius: 2px;

                &.multiple-color {
                    background-image: url('./bg-color.png');
                    background-size: 100% 100%;
                    background-position: center;
                    border: none;
                }
            }
        }
        &__alpha {
            font-size: 13px;
            color: #444950;
            padding: 12px 24px 27px 27px;
            user-select: none;

            .eui-v2-range-slider {
                margin-top: 5px;
                flex: 1;
                .slider-ball {
                    width: 12px;
                    height: 12px;
                }
            }

            &-value {
                display: flex;
                justify-content: space-between;
                align-items: center;

                &--tip {
                    color: @gray-color;
                    width: 49px;
                    text-align: right;
                    top: -1px;
                }
            }

            // .eui-v2-range-slider {
            //     flex: 1;
            // }
        }
    }
    .eui-v2-color-picker-panel {
        position: absolute;
        width: 256px;
        left: 14px;
        z-index: 2;
        background: #fff;
        border: 1px solid @border-color;
        box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
        border-radius: 4px;
        padding: 14px 14px 28px;
    }
}
</style>
