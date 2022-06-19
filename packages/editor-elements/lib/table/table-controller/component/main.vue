<template>
    <table
        ref="table"
        :class="bem('', [!editable && 'readonly'])"
        border="0"
        cellpadding="0"
        cellspacing="0"
        :style="containerStyle"
    >
        <colgroup>
            <col
                v-for="(col, i) in cells[0] || []"
                :key="i"
                :col="i + 1"
                :style="{ width: colWidths[i] ? colWidths[i] + 'px' : '' }"
            />
        </colgroup>
        <tbody>
            <tr
                v-for="(rows, rIdx) in cells"
                :key="rIdx"
                :row="rIdx + 1"
                :style="{ height: rowHeights[rIdx] ? rowHeights[rIdx] + 'px' : '' }"
            >
                <template v-for="(cell, cIdx) in rows">
                    <Cell
                        v-if="cell"
                        :key="cIdx"
                        :col="cIdx + 1"
                        :row="rIdx + 1"
                        :cell="cell"
                        :editable="editable"
                        :zoom="zoom"
                        @change="$emit('change', $event)"
                        @blur="(e, info) => $emit('blur', e, info)"
                        @focus="$emit('focus', $event)"
                    />
                </template>
            </tr>
        </tbody>
    </table>
</template>

<script>
import Cell from './cell.vue';
import bemMixin from '../bem.mixin';

export default {
    name: 'table-main',
    components: {
        Cell,
    },
    mixins: [bemMixin],
    props: {
        // 表格依赖的编辑选项
        model: {
            type: Object,
            default: () => ({}),
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
        cells() {
            return this.model.$cells;
        },
        containerStyle() {
            const { editable } = this;
            const style = {
                boxSizing: 'border-box',
                overflow: 'visible',
                tableLayout: 'fixed',
                borderCollapse: 'collapse',
                background: 'transparent',
                width: '100%',
                height: !editable ? '100%' : 'auto',
            };
            return style;
        },
        colLen() {
            return (this.cells[0] || []).length;
        },
        rowLen() {
            return this.cells.length;
        },
        colWidths() {
            return this.getAllStripSizes('c');
        },
        rowHeights() {
            return this.getAllStripSizes('r');
        },
    },
    methods: {
        // 获取所有行列宽高
        getAllStripSizes(type) {
            const { tableData } = this.model;
            const len = type === 'r' ? this.rowLen : this.colLen;
            const name = type === 'r' ? 'height' : 'width';
            const rules = type === 'r' ? tableData.rows : tableData.cols;
            const sizes = new Array(len);
            rules.forEach((rule, i) => {
                sizes[i] = rule[name];
            });
            return sizes;
        },
    },
};
</script>

<style lang="less">
.table-main {
    &__content {
        outline: none;
        > div {
            pointer-events: none;
        }

        // 限制行最小高度
        &:empty&:after {
            content: 'X';
            visibility: hidden;
        }
    }

    &--readonly {
        td {
            div {
                user-select: none;
            }
        }
    }
}
// chrome单独设置左边框，表格会出现裂缝BUG
.table-main tbody tr td {
    border: 0 solid transparent;
}

// safari user-select default is none 导致单元格div无法输入
[contenteditable] {
    -webkit-user-select: text;
    user-select: text;
}
</style>
