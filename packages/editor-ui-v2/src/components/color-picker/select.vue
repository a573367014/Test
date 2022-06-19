<template>
    <Popup :visible.sync="menuVisible" :classNames="[bem('pop'), popClass]" @inactive="handleClose">
        <slot name="toggle" :label="currentLabel" :open="handleOpenMenu">
            <div
                :class="[bem('toggle'), disableSelect && bem('toggle', 'unselect')]"
                @click="handleOpenMenu"
            >
                <span :class="bem('toggle__label')">{{ currentLabel }}</span>
                <Icon v-if="!disableSelect" :class="bem('toggle__icon')" name="select-arrows" />
            </div>
        </slot>
        <template #overlay>
            <Menu
                ref="menu1"
                :class="[bem('menu'), menuClass]"
                :options="trulyOptions"
                @select="handleSelect"
            />
        </template>
    </Popup>
</template>
<script>
import Menu from './menu.vue';
import Icon from '../../base/icon/index.vue';
import { Dropdown as Popup } from '@gaoding/gd-antd';
import { isNil } from 'lodash';

export default {
    name: 'eui-v2-color-picker-select',
    components: {
        Menu,
        Icon,
        Popup,
    },
    props: {
        options: {
            type: Array,
            default: () => [],
        },
        value: {
            type: [Object, String, Number],
            default: () => {},
        },
        valueKey: {
            type: String,
            default: 'value',
        },
        labelKey: {
            type: String,
            default: 'name',
        },
        placement: {
            type: String,
            default: 'top-start',
        },
        popClass: {
            type: String,
            default: '',
        },
        menuClass: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            menuVisible: false,
            hoverItemTop: 0,
        };
    },
    computed: {
        trulyOptions() {
            return this.options
                .filter((opt) => !!opt[this.labelKey])
                .map((opt) => ({
                    name: opt[this.labelKey],
                    value: opt[this.valueKey],
                    children: opt.children,
                }));
        },
        currentLabel() {
            if (!this.options.length) return '';
            if (isNil(this.value)) return this.options[0][this.labelKey];

            if (Object.prototype.toString.call(this.currentOption) !== '[object Object]') {
                const currentOption = this.options.find(
                    (item) => `${item[this.valueKey]}` === `${this.value}`,
                );

                return currentOption && currentOption[this.labelKey];
            }

            return this.currentOption[this.labelKey];
        },
        currentOption: {
            get() {
                return this.value;
            },
            set(option) {
                this.$emit('update:value', option);
                this.$emit('select', option);
            },
        },
        disableSelect() {
            return !this.options || this.options.length <= 1;
        },
    },
    methods: {
        handleClose() {
            this.$emit('inactive');
        },
        handleSelect(option) {
            this.currentOption = option;
            this.menuVisible = false;
            this.$emit('select', option);
        },
        handleOpenMenu() {
            if (this.options.length > 1) {
                this.menuVisible = !this.menuVisible;
            }
        },
        reset() {
            this.currentOption = null;
        },
    },
};
</script>
<style lang="less">
.eui-v2-color-picker-select {
    &__menu {
        width: 140px;
        overflow-y: auto;
    }

    &__toggle {
        display: inline;
        color: #33383e;
        cursor: pointer;

        &--unselect {
            cursor: default;
        }

        &__label {
            overflow: hidden;
            max-width: 150px;
            font-weight: 500;
            font-size: 13px;
            line-height: 20px;
            display: inline-block;
            white-space: nowrap;
            text-overflow: ellipsis;
        }
        &__icon {
            font-size: 16px;
            color: #9da3ac;
            margin-bottom: 1px;
        }
    }
}
</style>
