<template>
    <div class="eui-v2-effect-panel">
        <p v-if="panelTitle" class="eui-v2-effect-panel-head">
            {{ panelTitle }}
        </p>

        <toggle-tab
            v-if="tabs.length > 1"
            class="eui-v2-effect-tabs"
            :value="currentTab"
            :tabs="tabs"
            @change="
                (val) => {
                    currentTab = val;
                }
            "
        ></toggle-tab>

        <div class="eui-v2-effect-list-wrap" ref="listWrap">
            <ul class="eui-v2-effect-list" ref="list">
                <template v-if="tooltip">
                    <ToolTip :content="tooltip ? $tsl('无特效') : ''" :boundariesPadding="-1">
                        <li :class="{ active: !currentEffect }" @click="clearEffect">
                            <eui-v2-icon class="no-effect-icon" name="no-effect" />
                        </li>
                    </ToolTip>
                    <ToolTip
                        v-for="item in currentEffects"
                        :key="item.id"
                        :content="tooltip ? item.name : ''"
                        :boundariesPadding="-1"
                    >
                        <li
                            :ref="'effect_' + currentTab + '_' + item.id"
                            :class="{
                                active: currentEffect === item,
                                disabled: item.disabled,
                                color: item.color || '#fff',
                            }"
                            @mouseenter="effectHover(item)"
                            @click="changeEffect(item)"
                            :style="getEffectStyle(item)"
                        >
                            {{ item.name }}
                        </li>
                    </ToolTip>
                </template>

                <template v-else>
                    <li
                        v-if="supportNomarl"
                        :class="{ active: !currentEffect }"
                        @click="clearEffect"
                    >
                        <eui-v2-icon class="no-effect-icon" name="no-effect" />
                    </li>
                    <li
                        v-for="item in currentEffects"
                        :key="item.id"
                        :ref="'effect_' + currentTab + '_' + item.id"
                        :class="{
                            active: currentEffect === item,
                            disabled: item.disabled,
                            color: item.color || '#fff',
                        }"
                        @mouseenter="effectHover(item)"
                        @click="changeEffect(item)"
                        :style="getEffectStyle(item)"
                    >
                        {{ item.name }}
                    </li>
                </template>
            </ul>
        </div>
    </div>
</template>

<script>
import ToolTip from '../../base/tooltip';
import ToggleTab from '../../components/toggle-tab';
import { i18n } from '../../i18n';

const PREVIEW_WIDTH = 100;
const PREVIEW_HEIGHT = 80;

export default {
    components: {
        ToolTip,
        ToggleTab,
    },
    props: {
        panelTitle: {
            type: String,
            default: '',
        },
        effects: {
            type: Object,
            default: () => ({}),
        },
        currentEffect: {
            type: Object,
            default: () => null,
        },
        initTab: {
            type: String,
            default: '',
        },
        tooltip: {
            type: Boolean,
            default: false,
        },
        supportNomarl: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const tabs = Object.keys(this.effects);
        return {
            currentTab: this.initTab || tabs[0] || '',
        };
    },
    computed: {
        tabs() {
            const keys = Object.keys(this.effects);
            return keys.map((str) => ({
                content: str,
                name: str,
            }));
        },
        currentEffects() {
            return this.effects[this.currentTab] || [];
        },
    },
    watch: {
        tabs() {
            if (!this.currentTab) {
                this.currentTab = this.tabs[0];
            }
        },
        currentTab() {
            this.$refs.listWrap.scrollTop = 0;
            this.$nextTick(() => {
                this.scrollToSelect();
            });
        },
        initTab() {
            this.currentTab = this.initTab;
        },
    },
    mounted() {
        this.$nextTick(() => {
            this.scrollToSelect();
        });
    },
    methods: {
        $tsl: i18n.$tsl,
        getEffectStyle(item) {
            let style = {};
            let url = item.preview && item.preview.url;

            // zoom with max width or height
            if (url) {
                url += `?x-oss-process=image/resize,w_${Math.ceil(PREVIEW_WIDTH * 2)},h_${Math.ceil(
                    PREVIEW_HEIGHT * 2,
                )}/interlace,1`;
                style = {
                    backgroundImage: url ? `url(${url})` : null,
                    fontSize: 0,
                };
            }

            return style;
        },
        changeEffect(effect) {
            clearTimeout(this.effectHoverTimer);
            this.$emit('change', effect);
        },
        effectHover(effect) {
            clearTimeout(this.effectHoverTimer);
            this.effectHoverTimer = setTimeout(() => {
                this.$emit('hover-change', effect);
            }, 150);
        },
        clearEffect() {
            this.$emit('clear');
        },
        scrollToSelect() {
            const { currentTab, currentEffect, currentEffects } = this;

            if (currentEffect) {
                for (let i = 0; i < currentEffects.length; i++) {
                    const effect = currentEffects[i];
                    if (effect === currentEffect) {
                        const ref = this.$refs[`effect_${currentTab}_${effect.id}`][0];
                        ref.scrollIntoView();

                        const maxTop =
                            this.$refs.list.getBoundingClientRect().height -
                            this.$refs.listWrap.getBoundingClientRect().height;
                        if (maxTop > 0) {
                            const scrollTop = this.$refs.listWrap.scrollTop;
                            if (scrollTop < maxTop - 10) {
                                this.$refs.listWrap.scrollTop -= 50;
                            }
                        }

                        break;
                    }
                }
            }
        },
    },
};
</script>

<style lang="less">
.eui-v2-effect-panel {
    display: flex;
    flex-direction: column;
    position: relative;
    max-height: 380px;
    width: 252px;
    padding: 16px 0;
    box-sizing: border-box;
    text-align: center;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    background: #fff;
    ul {
        display: flex;
        margin: 0;
        padding: 0;
        list-style: none;
    }
    .eui-v2-effect-tabs {
        margin: 0 12px 8px;
        li {
            flex: 1;
            color: #000;
            border-left: 1px solid @border-color;
            cursor: pointer;
            &:first-child {
                border-radius: 4px 0 0 4px;
                border-left: none;
            }
            &:last-child {
                border-radius: 0 4px 4px 0;
            }
            &.active {
                color: #1d1e1f;
                font-weight: 600;
                background: #e0e5ea;
            }
        }
    }

    .eui-v2-effect-list-wrap {
        position: relative;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .eui-v2-effect-list {
        flex-wrap: wrap;
        width: 252px;
        padding: 0 11px;
        overflow-x: hidden;

        li {
            position: relative;
            margin: 4px;
            width: 68px;
            height: 68px;
            line-height: 68px;
            font-size: 12px;
            color: #333;
            text-align: center;
            border-radius: 4px;
            background-size: 90%;
            background-repeat: no-repeat;
            background-position: center;
            background-color: #f5f8fc;
            border-radius: 4px;
            cursor: pointer;
            box-sizing: border-box;

            &:not(.disabled) {
                &:hover,
                &.active {
                    border-color: @primary-color;
                }
            }

            &.disabled {
                opacity: 0.1;
                cursor: not-allowed;
                background-color: #f8fafc;
            }
        }
    }

    .no-effect-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        margin-top: -12px;
        margin-left: -12px;
        height: 24px;
        width: 24px;
    }

    .eui-v2-effect-panel-head {
        margin: 0 16px 13px;
        font-weight: 600;
        font-size: 14px;
        line-height: 20px;
        text-align: left;
    }
}
</style>
