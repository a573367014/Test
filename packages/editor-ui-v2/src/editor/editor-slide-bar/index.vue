<style lang="less">
.eui-v2-editor-slide-bar {
    position: fixed;
    right: 50px;
    bottom: 50px;
    background: white;
    box-shadow: 0px 8px 8px 0px rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    z-index: 4;
    width: 391px;
    height: 42px;
    justify-content: center;
    align-items: center;
    display: flex;

    &__button.eui-v2-button {
        padding: 9px 6px;
        margin-right: 2px;
        .eui-v2-icon {
            color: #444950;
        }
        &:hover {
            .eui-v2-icon {
                color: #2254f4;
            }
        }
        &[disabled] {
            .eui-v2-icon {
                color: #979797;
            }
        }
    }
    .button__exit-fullsreen {
        .eui-v2-icon {
            width: 16px;
            height: 16px;
        }
    }
    .eui-v2-buttons-bar__divide {
        height: 30px;
        margin-left: 5px;
        margin-right: 10px;
    }
    .index-button {
        width: 44px;
        font-size: 14px;
        font-weight: bold;
        line-height: 15px;
        transition: none;
        text-align: center;
        box-sizing: content-box;
        cursor: auto;
        .total-number {
            font-size: 12px;
            font-weight: normal;
            color: #979797;
        }
    }
    &__animation-button {
        width: 188px;
        font-size: 14px;
        color: #444950;
    }
    .eui-v2-icon {
        width: 10px;
        height: 10px;
    }
    .eui-v2-dropdown-menus {
        padding-bottom: 0;
        .eui-v2-dropdown-menu--middle {
            padding: 8px 14px;
            &:last-child {
                padding: 14px 14px;
                border-top: 1px solid #e0e5ea;
            }
            &.activated {
                background-color: transparent;
                color: #2254f4;
            }
            &:hover {
                background-color: #f0f3f4;
            }
        }
    }
    .eui-v2-dropdown-animation {
        .eui-v2-button__container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .animation__button-name {
            text-align: left;
            display: inline-block;
            width: 140px;
            font-weight: bold;
        }
    }
}
</style>

<template>
    <div class="eui-v2-editor-slide-bar">
        <ButtonsBar>
            <Button
                class="eui-v2-editor-slide-bar__button"
                icon-type="only"
                fill="clear"
                @click="toggleLayout(0)"
                :disabled="isFirstSlide"
                :tooltip="$tsl('回到第一页')"
                tooltip-side="top"
            >
                <eui-v2-icon name="back-first" />
            </Button>
            <Button
                icon-type="only"
                fill="clear"
                class="eui-v2-editor-slide-bar__button"
                @click="toggleLayout(-1)"
                :disabled="isFirstSlide"
                :tooltip="$tsl('上一张')"
                tooltip-side="top"
                :disabled-tooltip="$tsl('已经是第一张')"
            >
                <eui-v2-icon name="slide-left" />
            </Button>
            <Button
                fill="clear"
                class="eui-v2-editor-slide-bar__button index-button"
                icon-type="only"
            >
                {{ activedIndex + 1 }}
                <span class="total-number">/ {{ editor.layouts.length }}</span>
            </Button>
            <Button
                class="eui-v2-editor-slide-bar__button"
                icon-type="only"
                fill="clear"
                @click="toggleLayout(1)"
                :disabled="isLastSlide"
                :tooltip="$tsl('下一张')"
                tooltip-side="top"
                :disabled-tooltip="$tsl('已经是最后一张')"
            >
                <eui-v2-icon name="slide-right" />
            </Button>
            <eui-v2-divide-line />
            <Popup
                placement="top-center"
                :append-body="false"
                :allow-directions="['top', 'bottom']"
                as-ref-width
                :visible.sync="popupVisible"
            >
                <div class="eui-v2-dropdown-animation">
                    <Button
                        fill="clear"
                        class="eui-v2-editor-slide-bar__button"
                        @click="toggleEffectPanel"
                        icon-type="only"
                    >
                        <span class="animation__button-name">
                            {{
                                transitionModel.value === '' || transitionModel.value === 'none'
                                    ? $tsl('添加动画效果')
                                    : transitionModel.name
                            }}
                        </span>
                        <eui-v2-icon name="pop-up" />
                    </Button>
                </div>
                <DropdownMenus slot="content" :height="203" ref="listPanel">
                    <DropdownMenu
                        v-for="item in animationList"
                        :key="item.value"
                        :activated="item.value === transitionModel.value"
                        @click="onSelect(item)"
                    >
                        {{ item.name }}
                    </DropdownMenu>
                </DropdownMenus>
            </Popup>
            <eui-v2-divide-line />
            <Button
                class="button__exit-fullsreen eui-v2-editor-slide-bar__button"
                icon-type="only"
                fill="clear"
                @click="exitFullScreen"
                :tooptip="$tsl('退出预览')"
                tooltip-side="top"
            >
                <eui-v2-icon name="exit" />
            </Button>
        </ButtonsBar>
        <slot />
    </div>
</template>

<script>
import ButtonsBar from '../../base/buttons-bar';
import Button from '../../base/button';
import Popup from '../../base/popup';
import DropdownMenus from '../../base/dropdown-menus';
import DropdownMenu from '../../base/dropdown-menu';
import { i18n } from '../../i18n';

const ZOOM_MODE_FIT = 'modeFit';
const ZOOM_MODE_OFF = 'modeOff';

export default {
    components: {
        ButtonsBar,
        Button,
        Popup,
        DropdownMenus,
        DropdownMenu,
    },
    props: {
        editor: {
            type: Object,
            required: true,
        },
        activedIndex: {
            type: Number,
            default: 0,
        },
        transitionModel: {
            type: Object,
            default() {
                return {
                    value: '',
                    name: i18n.$tsl('添加动画效果'),
                };
            },
        },
    },
    data() {
        return {
            animationList: [
                {
                    name: i18n.$tsl('从左边飞入'),
                    value: 'left',
                },
                {
                    name: i18n.$tsl('从右边飞入'),
                    value: 'right',
                },
                {
                    name: i18n.$tsl('从上方飞入'),
                    value: 'top',
                },
                {
                    name: i18n.$tsl('从下方飞入'),
                    value: 'bottom',
                },
                {
                    name: i18n.$tsl('移除动画效果'),
                    value: 'none',
                },
            ],
            popupVisible: false,
        };
    },
    computed: {
        isLastSlide() {
            return this.activedIndex === this.editor.layouts.length - 1;
        },
        isFirstSlide() {
            return this.activedIndex === 0;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        onSelect(item) {
            this.popupVisible = false;
            this.$emit('update:transitionModel', item);
        },
        toggleLayout(index) {
            let nextIndex = this.activedIndex + index;
            if (!index) {
                nextIndex = 0;
            }

            this.$emit('toggle', nextIndex);
        },
        toggleEffectPanel() {
            this.popupVisible = !this.popupVisible;
        },
        exitFullScreen() {
            this.$emit('exit');
        },
    },
};
</script>
