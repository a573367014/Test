<template>
    <div
        :class="bem('', [type])"
        :name="`${type}-handle`"
        @mouseup="handleMouseup"
        @mousedown="handleMousedown"
        @click.stop="() => {}"
    >
        <div
            v-for="(item, i) in sizes"
            :key="i"
            :order="i + 1"
            :style="getBlockStyle(item, i)"
            :class="bem('block', [type, isFullStripSelected(i + 1) && 'current'])"
        >
            <div :order="i + 1" :class="bem('block-area', [type, 'a'])">
                <div :class="bem('block-area__inner')" :order="i + 1">
                    <span :class="bem('block-area__expand')" :order="i" />
                    <span
                        :class="bem('block-area__add-btn')"
                        data-cursor="pointer"
                        @click.stop="$emit('add', i, 0)"
                    >
                        <img src="../assets/add.svg" />
                    </span>
                </div>
                <p :class="bem('vain-line', [type, 'a'])" :style="calVainLineStyle()" />
            </div>
            <div :order="i + 1" :class="bem('block-area', [type, 'b'])">
                <div :class="bem('block-area__inner')" :order="i + 1">
                    <span :class="bem('block-area__expand')" :order="i + 2" />
                    <span
                        :class="bem('block-area__add-btn')"
                        data-cursor="pointer"
                        @click.stop="$emit('add', i, 1)"
                    >
                        <img src="../assets/add.svg" />
                    </span>
                </div>
                <p :class="bem('vain-line', [type, 'b'])" :style="calVainLineStyle()" />
            </div>
        </div>
        <TableStrips
            v-show="!disableLine"
            :type="type"
            :model="model"
            :tableInfo="tableInfo"
            @drag="($event, i) => $emit('drag', $event, i)"
        />
    </div>
</template>
<script>
import bemMixin from '../bem.mixin';
import TableStrips from './table-strips.vue';

export default {
    name: 'table-controller-handle',
    components: {
        TableStrips,
    },
    mixins: [bemMixin],
    props: {
        type: {
            type: String,
            default: '',
        },
        tableInfo: {
            type: Object,
            default: () => {},
        },
        range: {
            type: Object,
            default: () => {},
        },
        model: {
            type: Object,
            default: () => {},
        },
        disableLine: {
            type: Boolean,
            default: false,
        },
    },
    computed: {
        sizes() {
            const { type, tableInfo } = this;
            const { rowRects, colRects } = tableInfo;
            return type === 'row' ? rowRects : colRects;
        },
    },
    methods: {
        getBlockStyle(item, i) {
            const { type, tableInfo } = this;
            const { borderSizes, colRects, rowRects } = tableInfo;
            let boxShadow = '';
            if (type === 'row') {
                let { top, height } = item;
                if (i === 0) {
                    top = 0;
                    height = rowRects.length > 1 ? rowRects[1].top : tableInfo.size.height;
                } else if (i === rowRects.length - 1) {
                    height = tableInfo.size.height - rowRects[i].top;
                    boxShadow = 'none';
                }
                return {
                    top: top + 'px',
                    height: height + 'px',
                    boxShadow,
                };
            } else {
                let { left, width } = item;
                if (i === 0) {
                    left = 0;
                    width += borderSizes[3];
                } else if (i === colRects.length - 1) {
                    width += borderSizes[1];
                    boxShadow = 'none';
                }
                return {
                    left: left + 'px',
                    width: width + 'px',
                    boxShadow,
                };
            }
        },
        calVainLineStyle() {
            const { type, tableInfo } = this;
            const { size } = tableInfo;
            if (type === 'row') return { width: size.width + 12 + 'px' };
            else return { height: size.height + 12 + 'px' };
        },
        /**
         * 是否整道选中
         */
        isFullStripSelected(order) {
            const { range, type, tableInfo } = this;
            const { rowRects, colRects } = tableInfo;
            if (!range) return false;
            if (type === 'col') {
                return (
                    range.rowspan === rowRects.length &&
                    order >= range.col &&
                    order < range.col + range.colspan
                );
            } else if (type === 'row') {
                return (
                    range.colspan === colRects.length &&
                    order >= range.row &&
                    order < range.row + range.rowspan
                );
            }
        },
        handleMousedown(e) {
            if (e.button !== 0) return;
            const order = Number(e.target.getAttribute('order'));
            if (order) {
                this.$emit('mousedown', e, order);
            }
        },
        handleMouseup(e) {
            if (e.button !== 0) return;
            const order = Number(e.target.getAttribute('order'));
            if (!order) return;
            this.$emit('mouseup', e);
        },
    },
};
</script>
<style lang="less">
@area-size: 40px;
@handle-size: 12px;
@btn-size: 22px;
@C: .table-controller-handle;

@{C} {
    position: absolute;
    background: rgba(228, 246, 255, 0.96);

    // &:hover {
    //     z-index: 2;
    // }

    &--row {
        top: 0;
        left: -@handle-size;
        height: 100%;
        width: @handle-size;
    }

    &--col {
        top: -@handle-size;
        left: 0;
        width: 100%;
        height: @handle-size;
        display: flex;
    }

    &__block {
        position: absolute;

        &:hover {
            background: linear-gradient(0deg, rgba(77, 124, 255, 0.2), rgba(77, 124, 255, 0.2)),
                #e8f7ff;
        }

        &:before {
            content: '';
            position: absolute;
            background-color: #d0e1ea;
        }

        &--row {
            width: 100%;
            &:before {
                top: -1px;
                left: 0;
                width: 100%;
                height: 1px;
            }
        }

        &--col {
            height: 100%;
            &:before {
                top: 0;
                left: -1px;
                width: 1px;
                height: 100%;
            }
        }
    }

    &__block-area {
        position: absolute;

        &:hover {
            z-index: 1;
        }

        &--col {
            width: 50%;
            height: @handle-size;
        }
        &--col&--a {
            left: 0;
        }
        &--col&--b {
            right: 0;
        }

        &--row {
            height: 50%;
            width: @handle-size;
        }
        &--row&--a {
            top: 0;
        }
        &--row&--b {
            bottom: 0;
        }

        &__inner {
            position: absolute;
            display: none;
        }
        &:hover &__inner {
            display: block;
        }
        @{C}--col &__inner {
            height: @area-size;
            bottom: 0;
            width: calc(100% + @btn-size);
        }
        @{C}--col &--a &__inner {
            left: -@btn-size;
        }
        @{C}--col &--b &__inner {
            right: -@btn-size;
        }
        @{C}--row &__inner {
            right: 0;
            width: @area-size;
            height: calc(100% + @btn-size);
        }
        @{C}--row &--a &__inner {
            top: -@btn-size;
        }
        @{C}--row &--b &__inner {
            bottom: -@btn-size;
        }

        &__expand {
            position: absolute;
        }
        @{C}--col &__expand {
            width: @btn-size;
            height: 100%;
        }
        @{C}--col &--a &__expand {
            left: 0;
        }
        @{C}--col &--b &__expand {
            right: 0;
        }
        @{C}--row &__expand {
            height: @btn-size;
            width: 100%;
        }
        @{C}--row &--a &__expand {
            top: 0;
        }
        @{C}--row &--b &__expand {
            bottom: 0;
        }

        &__add-btn {
            position: absolute;
            width: @btn-size;
            height: @btn-size;
            text-align: center;
            background-color: white;
            border: 1px solid #ccd1da;
            border-radius: 1px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        @{C}--col &--a &__add-btn {
            left: @btn-size / 2;
        }
        @{C}--col &--b &__add-btn {
            right: @btn-size / 2;
        }
        @{C}--row &--a &__add-btn {
            top: @btn-size / 2;
        }
        @{C}--row &--b &__add-btn {
            bottom: @btn-size / 2;
        }
    }

    &__vain-line {
        position: absolute;
        margin: 0;
        opacity: 0;
        background-color: #33383e;
        pointer-events: none;
        transition: opacity 300ms;

        @{C}__block-area:hover & {
            opacity: 1;
        }

        &--row {
            left: 0;
            height: 2px;
        }
        &--col {
            top: 0;
            width: 2px;
        }
        &--row&--a {
            top: -1px;
        }
        &--row&--b {
            bottom: -1px;
        }
        &--col&--a {
            left: -1px;
        }
        &--col&--b {
            right: -1px;
        }
    }
}
</style>
