<template>
    <div :class="bem('', [type])">
        <div
            :class="bem('line', [currentIndex === i && 'current'])"
            v-for="(item, i) in sizes"
            :key="type + i"
            :style="calLineStyle(i)"
            :data-cursor="'cursor:ewResize' + ', rotate:' + rotate"
            @mousedown="handleMouseDown($event, i)"
            @click.stop="() => {}"
            @mouseenter="handleMouseEnter($event, i)"
            @mouseleave="handleMouseLeave($event, i)"
        />
    </div>
</template>
<script>
import bemMixin from '../bem.mixin';

export default {
    name: 'table-strips',
    mixins: [bemMixin],
    props: {
        type: {
            type: String,
            default: 'col',
        },
        model: {
            type: Object,
            default: () => {},
        },
        tableInfo: {
            type: Object,
            default: () => {},
        },
    },
    data() {
        return {
            currentIndex: -1,
        };
    },
    computed: {
        sizes() {
            const { type, tableInfo } = this;
            const { rowRects, colRects } = tableInfo;
            return type === 'row' ? rowRects : colRects;
        },
        rotate() {
            const { type, model } = this;
            return type === 'row' ? 90 - model.rotate : 0 - model.rotate;
        },
    },
    methods: {
        calLineStyle(i) {
            const { type, tableInfo } = this;
            const { size, rowRects, colRects } = tableInfo;
            if (type === 'row') {
                return {
                    top: rowRects[i].top + rowRects[i].height + 'px',
                    width: size.width + 12 + 'px',
                };
            } else {
                return {
                    left: colRects[i].left + colRects[i].width + 'px',
                    height: size.height + 12 + 'px',
                };
            }
        },
        handleMouseDown(e, i) {
            if (this.currentIndex === i) {
                e.stopPropagation();
                this.$emit('drag', e, i);
            }
        },
        handleMouseEnter(e, i) {
            clearTimeout(this._timer);
            this._timer = setTimeout(() => {
                this.currentIndex = i;
            }, 300);
        },
        handleMouseLeave() {
            clearTimeout(this._timer);
            this.currentIndex = -1;
        },
    },
};
</script>
<style lang="less">
.table-strips {
    position: absolute;
    left: 0;
    top: 0;
    &__line {
        position: absolute;
        &:after {
            content: '';
            position: absolute;
        }
        &--current {
            &:after {
                background-color: #4d7cff;
            }
        }
    }
    &--row &__line {
        left: 0;
        height: 4px;
        transform: translateY(-2px);
        &:after {
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            height: 1px;
            width: calc(100% - 12px);
        }
    }
    &--col &__line {
        top: 0;
        width: 4px;
        transform: translateX(-2px);
        &:after {
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 1px;
            height: calc(100% - 12px);
        }
    }
}
</style>
