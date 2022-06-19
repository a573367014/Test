<template>
    <g-popover
        placement="bottom"
        :getPopupContainer="_getPopupContainer"
        :overlayClassName="inputPopOverlayClassName"
        :visible="visible"
        trigger="click"
    >
        <template slot="content">
            <div v-if="historySearchList.length" class="ge-input-popover__history-text">
                <span
                    v-for="(val, i) in historySearchList"
                    :key="i"
                    @click="$emit('setSearchValue', val)"
                >
                    {{ val }}
                </span>
            </div>
            <div class="ge-input-popover__hot" v-if="hotWordList.length">
                <span class="ge-input-popover__hot__title">大家都在搜</span>
                <div class="ge-input-popover__hot__list">
                    <div
                        class="ge-input-popover__hot__list__item"
                        v-for="(word, i) in hotWordList"
                        :key="i"
                        @click="setSearchValue(word)"
                    >
                        <span
                            :class="[
                                'ge-input-popover__hot__list__item__rank',
                                hotRankClass(i + 1),
                            ]"
                        >
                            {{ i + 1 }}
                        </span>
                        <span class="ge-input-popover__hot__list__item__word">{{ word }}</span>
                    </div>
                </div>
            </div>
        </template>
        <template v-if="historySearchList.length" slot="title">
            <span>历史记录</span>
            <!-- 清除记录 -->
            <span class="ge-input-popover--clear" @click="handleClear">清空</span>
        </template>
        <!-- 输入框插槽 -->
        <slot name="inputSlot"></slot>
    </g-popover>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import Popover from '@gaoding/gd-antd/es/popover';

const mapRankToClass: Record<string, string> = {
    1: 'first',
    2: 'second',
    3: 'third',
    default: 'default',
};

/**
 * @title 组件名
 * GePopoverInput
 */
/**
 * @title 描述
 * 搜索框附加弹层
 */
/**
 * @title 使用场景
 * 当搜索框需要历史记录和热词弹层时使用
 */
export default defineComponent({
    name: 'GePopoverInput',
    components: {
        GPopover: Popover,
    },
    props: {
        // 挂载的元素样式类，否则默认挂载body上
        getPopupContainer: {
            type: Function as PropType<() => HTMLElement>,
            default: () => {},
        },
        // 历史搜索词组
        historySearchList: {
            type: Array as PropType<Array<string>>,
            default: () => [],
        },
        // 热搜词组
        hotWordList: {
            type: Array as PropType<Array<string>>,
            default: () => [],
        },
        // 是否显示
        visible: {
            type: Boolean,
            default: false,
        },
    },
    emits: [
        /**
         * 清除历史时回调
         */
        'clearHistoryWord',
        /**
         * 设置输入值时回调
         * @param {string} value 使用值
         */
        'setSearchValue',
    ],
    setup(props, { emit }) {
        // 树形下拉框更改挂载位置
        function _getPopupContainer() {
            return props.getPopupContainer() || document.body;
        }
        const inputPopOverlayClassName = computed(() => {
            if (!props.historySearchList.length) {
                return 'ge-input-popover ge-input-popover__history--hidden';
            }
            return 'ge-input-popover ge-input-popover__history';
        });
        function hotRankClass(index: number) {
            const prefix = 'ge-input-popover__hot__list__item__rank--';
            return prefix + (mapRankToClass[index] || mapRankToClass.default);
        }
        function handleClear() {
            // 清除历史
            emit('clearHistoryWord');
        }
        function setSearchValue(val: string) {
            // 设置输入值
            // @arg (value: string);
            emit('setSearchValue', val);
        }
        return {
            _getPopupContainer,
            inputPopOverlayClassName,
            hotRankClass,
            handleClear,
            setSearchValue,
        };
    },
});
</script>
