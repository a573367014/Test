<template>
    <DropdownButton
        class="eui-v2-select"
        :asRefWidth="asRefWidth"
        :append-body="appendBody"
        :fill="fill"
        :size="size">
        <span>{{currentOption.name}}</span>

        <template v-slot:suffix-icon>
            <slot name="suffix-icon" />
        </template>

        <template v-slot:dropdown="dropdown">
            <DropdownMenus :class="classSelect">
                <DropdownMenu
                    v-for="option in options"
                    :key="option.value"
                    :class="{
                        selected: currentOption === option
                    }"
                    @click="onOptionClick(option, dropdown)"
                >
                    <slot v-if="$scopedSlots.itemRender" name="itemRender" :option="option" />
                    <template v-else>{{ option.name }}</template>
                </DropdownMenu>
            </DropdownMenus>
        </template>
    </DropdownButton>
</template>

<script>
import DropdownButton from '../dropdown-button';
import DropdownMenu from '../dropdown-menu';
import DropdownMenus from '../dropdown-menus';

export default {
    components: {
        DropdownMenu,
        DropdownMenus,
        DropdownButton
    },

    model: {
        prop: 'value',
        event: 'change'
    },

    props: {
        fill: {
            type: String,
            default: '',
        },

        classSelect: {
            type: String,
            default: ''
        },

        value: {
            type: [String, Number, Boolean],
            default: ''
        },

        options: {
            type: Array,
            default() {
                return [];
            }
        },

        appendBody: {
            type: Boolean,
            default: true
        },

        autoClose: {
            type: Boolean,
            default: true
        },

        size: {
            type: String,
            default: 'mini'
        },

        asRefWidth: {
            type: Boolean,
            default: true
        }
    },

    computed: {
        currentOption() {
            return (
                this.options.find(option => option.value === this.value) ||
                this.options[0] ||
                {}
            );
        }
    },

    methods: {
        onOptionClick(option, dropdown) {
            this.$emit('click-option', option);
            this.$emit('change', option.value);
            if(this.autoClose) {
                dropdown.close();
            }
        }
    },
};
</script>

<style lang="less">


</style>
