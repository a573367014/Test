<template>
    <div ref="mainRef" class="ge-style-select-item-list">
        <div
            class="ge-style-select-item-list__segment"
            v-for="(segment, index) in segmentList"
            :key="segment.key || index"
        >
            <!-- 副标题 -->
            <div class="ge-style-select-item-list__subtitle" v-if="segment.title">
                {{ segment.title }}
            </div>
            <!-- 分段行 -->
            <div
                class="ge-style-select-item-list__row"
                v-for="(colList, rowIndex) in segment.rowList"
                :key="rowIndex"
            >
                <!-- item -->
                <div class="ge-style-select-item-list__row__items">
                    <div
                        class="ge-style-select-item-list__item"
                        v-for="(colItem, colIndex) in colList"
                        :key="colItem.data.id || colIndex"
                        :style="{
                            marginLeft: colItem.margin + 'px',
                        }"
                        @click="handleItemClick(colItem.data)"
                    >
                        <!-- 样式图 -->
                        <ge-image
                            :src="colItem.data.src"
                            :showCopyRight="colItem.data.showCopyRight"
                            :lowerRightCornerUrl="colItem.data.bottomRightUrl"
                            :checked="checked(colItem.data)"
                            :showCheck="true"
                            :width="colItem.size"
                            :height="colItem.size"
                            :showMark="false"
                            :showMore="false"
                        />
                        <!-- 样式标题 -->
                        <div
                            class="ge-style-select-item-list__item__title"
                            :style="{ maxWidth: colItem.size + 'px' }"
                        >
                            {{ colItem.data.title }}
                        </div>
                    </div>
                </div>
                <!-- 强度 slider -->
                <div class="ge-style-select-item-list__row__slider" v-if="showSlider(colList)">
                    <ge-slider-list :list="getSelectSliderList" />
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref, toRef } from '@vue/composition-api';
import GeImage from '../image';
import GeSliderList from '../slider-list';
import { ISegmentItem, IStyleSelectItem } from '../../../types';
import { useSegmentList } from './hooks/index';

interface IColItem {
    index: number;
    margin: number;
    size: number;
    rowIndex: number;
    data: IStyleSelectItem;
}
/**
 * @title 组件名
 * GeStyleSelectItemList
 */
/**
 * @title 描述
 * 通用属性选择面板，支持选择对应属性，配置属性强度
 */
/**
 * @markdown 使用场景
 * - 转场选择面板
 * - 特效选择面板
 * - 滤镜选择面板
 * - 等属性选择及属性强度配置场景
 */
export default defineComponent({
    name: 'GeStyleSelectItemList',
    components: {
        GeImage,
        GeSliderList,
    },
    props: {
        /**
         * 数据源
         */
        list: {
            type: Array as PropType<ISegmentItem[] | IStyleSelectItem[]>,
            default: () => [],
        },
        /**
         * 单个item大小，只支持正方形
         */
        itemSize: {
            type: Number,
            default: 72,
        },
        /**
         * 当前选中的item 或 item对应的id
         */
        selectItem: {
            type: Object as PropType<IStyleSelectItem | null>,
            default: null,
        },
    },
    setup(props, { emit }) {
        const containerWidth = ref(0);
        const mainRef = ref();
        const { segmentList } = useSegmentList(
            containerWidth,
            toRef(props, 'itemSize'),
            toRef(props, 'list'),
        );

        onMounted(() => {
            containerWidth.value = mainRef.value.getBoundingClientRect().width;
            // TODO 监听改变
        });

        /**
         * 判断是否选中
         */
        const checked = (item: IStyleSelectItem) => {
            // return props.selectItem && item.id === props.selectItem?.id;
            return props.selectItem && item === props.selectItem;
        };

        /**
         * 获取强度slider list
         */
        const getSelectSliderList = computed(() => {
            if (!props.selectItem || !props.selectItem.styleSliderList) {
                return [];
            }
            return props.selectItem.styleSliderList;
        });

        /**
         * 是否显示强度调节
         */
        const showSlider = (colList: IColItem[]) => {
            if (!props.selectItem || !props.selectItem?.styleSliderList) {
                return false;
            }
            return colList.find((item) => {
                return item.data === props.selectItem;
            });
        };
        const handleItemClick = (item: IStyleSelectItem) => {
            emit('select', item);
        };
        return {
            checked,
            mainRef,
            segmentList,
            showSlider,
            handleItemClick,
            getSelectSliderList,
        };
    },
});
</script>
