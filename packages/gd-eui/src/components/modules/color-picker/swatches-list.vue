<template>
    <div class="swatches">
        <div class="swatches__title__wrap">
            <dropdown class="swatches__dropdown" :trigger="['click']" :placement="'topLeft'">
                <div class="swatches__title__icon">
                    <div class="title">颜色预设</div>
                    <ge-icon class="swatches__icon" type="fill_chevrons_unfold" />
                </div>

                <a-menu style="margin-bottom: -20px" slot="overlay">
                    <template v-for="firstMenu in colorList">
                        <menu-item
                            class="swatches__menu__item"
                            v-if="!firstMenu.swatches"
                            :key="firstMenu.title"
                            @click="handleMenuClick(firstMenu)"
                        >
                            <a href="javascript:;">{{ firstMenu.title }}</a>
                        </menu-item>
                        <sub-menu
                            class="swatches__menu__item"
                            :title="firstMenu.title"
                            :key="firstMenu.title"
                            v-else
                        >
                            <menu-item
                                class="swatches__menu__item"
                                v-for="secMenu in firstMenu.swatches"
                                :key="secMenu.title"
                                @click="handleMenuClick(secMenu)"
                            >
                                <a href="javascript:;">{{ secMenu.title }}</a>
                            </menu-item>
                        </sub-menu>
                    </template>
                </a-menu>
            </dropdown>
        </div>
        <div class="swatches__list">
            <div
                class="swatches__list__item"
                v-for="item in currentColor.list"
                :key="item"
                @click="handleColorClick(item)"
            >
                <div class="swatches__list__item__color" :style="{ background: item }"></div>
                <check-board class="swatches__check__board"></check-board>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import { ISwatches } from '../../../types/swatches-list';
import Dropdown from '@gaoding/gd-antd/es/dropdown';
import Menu from '@gaoding/gd-antd/es/menu';
import CheckBoard from './check-board.vue';

export default defineComponent({
    name: 'ge-swatches',
    components: {
        Dropdown,
        'a-menu': Menu,
        MenuItem: Menu.Item,
        SubMenu: Menu.SubMenu,
        CheckBoard,
    },
    props: {
        list: {
            type: Array as PropType<ISwatches[]>,
            default: () => [],
        },
    },
    setup(props, { emit }) {
        const colorList = ref<ISwatches[]>(props.list);
        const colorsFilter = (index: number, colorList: ISwatches[]) => {
            if (index >= colorList.length || index < 0) {
                return {
                    title: '',
                    list: [],
                };
            }
            const swatches = colorList[index];
            if (swatches.swatches?.length) {
                return swatches.swatches[0];
            }
            return swatches;
        };
        const currentColor = ref(colorsFilter(0, colorList.value));
        const handleMenuClick = (item: ISwatches) => {
            currentColor.value = item;
        };
        const handleColorClick = (item: String) => {
            emit('select', item);
        };
        return {
            colorList,
            currentColor,
            handleMenuClick,
            handleColorClick,
        };
    },
});
</script>
