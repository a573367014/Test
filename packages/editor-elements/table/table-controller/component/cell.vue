<template>
    <td
        :col="col"
        :row="row"
        :colspan="cell.colspan"
        :rowspan="cell.rowspan"
        :style="wrapStyle"
        class="table-main__cell"
    >
        <CellContent
            class="table-main__content"
            :style="contentStyle"
            :readonly="!editable"
            :col="col"
            :row="row"
            :colspan="cell.colspan"
            :rowspan="cell.rowspan"
            :value="cell.content"
            @change="$emit('change', { v: $event, r: row - 1, c: col - 1 })"
            @blur="$emit('blur', $event, { r: row - 1, c: col - 1 })"
            @focus="$emit('focus', $event)"
        />
    </td>
</template>
<script>
import { get4SizeNames } from '../../utils';
import CellContent from './cell-content.vue';

export default {
    name: 'table-cell',
    components: {
        CellContent,
    },
    props: {
        row: {
            type: Number,
            default: 1,
        },
        col: {
            type: Number,
            default: 1,
        },
        cell: {
            type: Object,
            default: () => {},
        },
        editable: {
            type: Boolean,
            default: false,
        },
        zoom: {
            type: Number,
            default: 1,
        },
    },
    computed: {
        wrapStyle() {
            const { cell, zoom } = this;
            const style = {
                position: 'relative',
                padding: 0,
                margin: 0,
                boxSizing: 'content-box',
                backgroundClip: 'padding-box',
                ...cell.$wrapCssStyle,
            };

            // 边框1px，画布缩放导致边框消失问题
            if (zoom < 1) {
                get4SizeNames('border').forEach((name) => {
                    name += 'Width';
                    if (style[name]) {
                        const borderWidth = parseInt(style[name]);
                        if (borderWidth === 1) {
                            style[name] = Math.round(borderWidth / zoom) + 'px';
                        }
                    }
                });
            }
            return style;
        },
        contentStyle() {
            const { cell } = this;
            const style = {
                wordBreak: 'break-all',
                overflowWrap: 'normal',
                ...cell.$contentCssStyle,
            };
            return style;
        },
    },
};
</script>
