<template>
    <div class="color-picker">
        <div class="color-picker__tabs" v-if="tabsBar.length > 1">
            <div
                class="color-picker__tabs__tab"
                v-for="(item, index) in tabsBar"
                :key="item.type"
                @click="handleTabClick(index)"
                :style="{ width: tabItemWidth + 'px' }"
            >
                {{ item.tabStr }}
            </div>

            <div
                v-show="currentTabBar"
                class="color-picker__tabs__active"
                :style="currentTabActivityStyle"
            >
                {{ currentTabBar.tabStr }}
            </div>
        </div>
        <color-picker-panel
            v-model="singleColor"
            v-show="tabs[currentTab] === ColorPickerType.SINGLE"
            class="color-picker__panel"
            :swatchesList="swatchesList"
            @change="onColorChange"
        />
        <gradient-picker-panel
            v-model="gradientList"
            :degree="degree"
            :swatchesList="swatchesList"
            v-show="tabs[currentTab] === ColorPickerType.GRADIENT"
            @change="onGradientColorChange"
            @changeDegree="onDegreeChange"
        />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, Ref, ref, PropType } from '@vue/composition-api';
import { ColorPickerType, IColor, IGradientColor } from '../../../types/color-picker';
import ColorPickerPanel from './color-picker-panel.vue';
import GradientPickerPanel from './gradient-picker-panel.vue';
import { ISwatches } from '../../../types/swatches-list';
import { getTransformationIColor } from '../../../utils/get-transformation-color';
import { getColorStringByIColor } from '../../../utils/get-color-string-by-icolor';
import { transformationGradientString } from '../../../utils/get-transformation-gradient';

interface TabBar {
    tabStr: string;
    type: ColorPickerType;
}

/**
 * @title 组件名
 * GeColorPicker
 */

/**
 * @title 描述
 * 用于颜色、渐变色选择
 */

/**
 * @title 使用场景
 * @dot 纯色颜色选择
 * @dot 渐变色选择
 */
export default defineComponent({
    name: 'GeColorPicker',
    components: { ColorPickerPanel, GradientPickerPanel },
    props: {
        /**
         * 默认纯色
         * IColor 对象或者 string，支持hex，rgba 等css表现形式
         */
        defaultColor: {
            type: [Object, String] as PropType<IColor | string>,
            default: '#ff0000',
        },
        /**
         * 默认渐变色
         */
        defaultGradientColor: {
            type: Array as PropType<Array<IGradientColor>>,
            default: () => [
                {
                    color: '#ff0000',
                    offset: 0,
                },
            ],
        },
        /**
         * 默认渐变色角度
         */
        defaultDegree: {
            type: Number,
            default: ColorPickerType.SINGLE,
        },
        /**
         * 默认模式tab列表
         */
        defaultTabs: {
            type: Array as PropType<Array<ColorPickerType>>,
            default: () => [ColorPickerType.SINGLE],
        },
        /**
         * 默认显示tab
         */
        defaultShowTab: {
            type: Number,
            default: 0,
        },
        /**
         * 预选色列表
         */
        swatchesList: {
            type: Array as PropType<ISwatches[]>,
            default: () => [
                {
                    title: '默认',
                    list: [
                        '#122BCC',
                        '#636C78',
                        '#F7BF01',
                        '#593CCD',
                        '#AD2698',
                        '#FF0154',
                        '#FF014E',
                        '#FF0128',
                    ],
                },
            ],
        },
    },
    emits: [
        /**
         * 渐变色回调
         * @param {Array<IGradientColor>} gl 渐变色对象
         */
        'gradientChange',
        /**
         * 纯色回调
         * @param {string} color 纯色对象
         */
        'colorChange',
        /**
         * 角度回调
         * @param {number} degree 角度
         */
        'degreeChange',
    ],
    setup(props, { emit }) {
        const singleColor = ref(getTransformationIColor(props.defaultColor));
        const degree: Ref<number> = ref(props.defaultDegree);
        const gradientList: Ref<Array<IGradientColor>> = ref(props.defaultGradientColor);

        const filterTabs = (types: ColorPickerType[]) => {
            const set = new WeakSet<Number>();
            const typeList: Array<ColorPickerType> = types.filter((item: ColorPickerType) => {
                return !set.has(item);
            });
            return typeList;
        };
        const filterIndexByTabs = (types: ColorPickerType[], showType: ColorPickerType) => {
            for (let index = 0; index < types.length; index++) {
                const type = types[index];
                if (type === showType) {
                    return index;
                }
            }
            return 0;
        };
        const tabs: Ref<Array<ColorPickerType>> = ref(filterTabs(props.defaultTabs));
        const currentTab: Ref<number> = ref(filterIndexByTabs(tabs.value, props.defaultShowTab));
        const tabMap = {
            [ColorPickerType.SINGLE]: '纯色',
            [ColorPickerType.GRADIENT]: '渐变',
            [ColorPickerType.MAP]: '图案',
        };
        const tabsBar = computed(() => {
            const list: TabBar[] = [];
            for (let index = 0; index < tabs.value.length; index++) {
                const item = tabs.value[index];
                const tabStr = tabMap[item];
                list.push({
                    type: item,
                    tabStr,
                });
            }
            return list;
        });
        const tabItemWidth = computed(() => {
            if (tabsBar.value.length === 3) {
                return 82;
            } else if (tabsBar.value.length === 2) {
                return 121;
            }
            return 0;
        });
        const currentTabBar = computed(() => {
            if (currentTab.value <= tabs.value.length - 1 && currentTab.value >= 0) {
                const type = tabs.value[currentTab.value];
                return {
                    type,
                    tabStr: tabMap[type],
                };
            }
            return null;
        });
        const currentTabActivityStyle = computed(() => {
            return {
                left: (currentTab.value + 1) * 2 + tabItemWidth.value * currentTab.value + 'px',
                width: tabItemWidth.value + 'px',
            };
        });
        const handleTabClick = (index: number) => {
            currentTab.value = index;
        };
        /**
         * @function
         * 显示选项
         * @param types 要显示颜色选择类型
         * @param showType 指向对应类型
         */
        const show = function (types: ColorPickerType[], showType: ColorPickerType) {
            tabs.value = filterTabs(types);
            currentTab.value = filterIndexByTabs(tabs.value, showType);
        };
        /**
         * @function
         * 获取当前纯色
         * @returns {string} 返回纯色
         */
        const getColor = (): string => {
            return getColorStringByIColor(singleColor.value);
        };
        /**
         * @function
         * 获取当前渐变色
         */
        const getGradientColor = (): IGradientColor[] => {
            return gradientList.value;
        };
        /**
         * @function
         * 获取当前角度
         */
        const getDegree = (): number => {
            return degree.value;
        };
        /**
         * @function
         * 纯色配置
         * @param color 纯色
         */
        const useColor = (color: IColor | string) => {
            singleColor.value = getTransformationIColor(color);
        };
        /**
         * @function
         * 角度配置
         * @param deg 角度
         */
        const useDegree = (deg: number) => {
            degree.value = deg;
        };
        /**
         * @function
         * 渐变色配置
         * @param gl 渐变色
         */
        const useGradient = (gl: Array<IGradientColor>) => {
            if (gl.length === 0) {
                return;
            }
            gradientList.value = gl;
        };
        // 渐变色改变时回调
        const onGradientColorChange = (gl: Array<IGradientColor>) => {
            emit('gradientChange', transformationGradientString(gl));
        };
        // 单色改变时回调
        const onColorChange = (color: IColor) => {
            emit('colorChange', getColorStringByIColor(color));
        };
        // 角度改变时回调
        const onDegreeChange = (degree: number) => {
            emit('degreeChange', degree);
        };
        return {
            tabs,
            degree,
            gradientList,
            singleColor,
            currentTab,
            currentTabBar,
            tabsBar,
            currentTabActivityStyle,
            ColorPickerType,
            tabItemWidth,
            handleTabClick,
            onColorChange,
            onGradientColorChange,
            onDegreeChange,
            // api
            show,
            getColor,
            getGradientColor,
            getDegree,
            useColor,
            useDegree,
            useGradient,
        };
    },
});
</script>
