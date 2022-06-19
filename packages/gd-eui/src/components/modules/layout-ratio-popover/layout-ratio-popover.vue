<template>
    <div class="ge-layout-ratio-popover">
        <Popover overlayClassName="ge-layout-ratio-popover__popover">
            <slot />
            <template slot="content">
                <div
                    :class="{
                        'ge-layout-ratio-popover__item': true,
                        'ge-layout-ratio-popover__item__active': checked(item.type),
                    }"
                    v-for="item in ratioList"
                    :key="item.type"
                    @click="handleItemClick(item.type)"
                >
                    <div class="ge-layout-ratio-popover__item__left">
                        <ge-icon :type="item.icon" />
                        <div class="ge-layout-ratio-popover__item__left-title">
                            {{ item.title }}
                        </div>
                    </div>
                    <ge-icon
                        v-show="checked(item.type)"
                        class="ge-layout-ratio-popover__item__active-icon"
                        type="check_outline"
                    />
                </div>
            </template>
        </Popover>
    </div>
</template>
<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import Popover from '@gaoding/gd-antd/es/popover';
import { LayoutRatioType, TypeTitleMap } from '../../../types/layout-ratio-popover';

/**
 * @title 组件名
 * GeLayoutRatioPopover
 */
/**
 * @title 描述
 * 画布的比例选择器弹层
 */
/**
 * @title 使用场景
 * - 画布比例显示与选择
 */
export default defineComponent({
    name: 'GeLayoutRatioPopover',
    components: {
        Popover,
    },
    props: {
        /**
         * 显示比例类型列表
         */
        ratioTypes: {
            type: Array as PropType<LayoutRatioType[]>,
            default: () => [
                LayoutRatioType.TypeDefault,
                LayoutRatioType.Type9_16,
                LayoutRatioType.Type3_4,
                LayoutRatioType.Type1_1,
                LayoutRatioType.Type4_3,
                LayoutRatioType.Type16_9,
            ],
        },
        /**
         * 当前比例类型
         */
        value: {
            type: Number as PropType<LayoutRatioType>,
            default: LayoutRatioType.TypeDefault,
        },
    },
    emits: [
        /**
         * 当比例点击改变的时候回调
         * @param {LayoutRatioType} type
         */
        'change',
    ],
    setup(props, { emit }) {
        const rationMap = {
            [LayoutRatioType.TypeDefault]: {
                icon: 'Free_outline',
                title: TypeTitleMap[LayoutRatioType.TypeDefault],
            },
            [LayoutRatioType.Type9_16]: {
                icon: 'a-9_16_outline',
                title: TypeTitleMap[LayoutRatioType.Type9_16],
            },
            [LayoutRatioType.Type3_4]: {
                icon: 'a-3_4_outline',
                title: TypeTitleMap[LayoutRatioType.Type3_4],
            },
            [LayoutRatioType.Type1_1]: {
                icon: 'a-1_1_outline',
                title: TypeTitleMap[LayoutRatioType.Type1_1],
            },
            [LayoutRatioType.Type4_3]: {
                icon: 'a-4_3_outline',
                title: TypeTitleMap[LayoutRatioType.Type4_3],
            },
            [LayoutRatioType.Type16_9]: {
                icon: 'a-16_9_outline',
                title: TypeTitleMap[LayoutRatioType.Type16_9],
            },
        };
        const checked = (type: LayoutRatioType) => {
            return type === props.value;
        };
        const ratioList = computed(() => {
            return props.ratioTypes.map((type) => {
                return {
                    type,
                    ...rationMap[type],
                };
            });
        });
        const handleItemClick = (type: LayoutRatioType) => {
            if (type === props.value) {
                return;
            }
            emit('change', type);
        };
        return {
            ratioList,
            checked,
            handleItemClick,
        };
    },
});
</script>
