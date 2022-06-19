<template>
    <div :class="bem('')">
        <ToggleTab
            :class="bem('tabs')"
            :value="value"
            @change="$emit('change', $event)"
            :tabs="tabsList"
        />
    </div>
</template>

<script>
import ToggleTab from '../toggle-tab/index.vue';

export default {
    name: 'eui-v2-color-picker-header',
    components: {
        ToggleTab
    },

    model: {
        prop: 'value',
        event: 'change',
    },

    props: {
        tabs: {
            type: Array,
            default: () => []
        },
        value: {
            type: String,
            default: ''
        }
    },

    computed: {
        tabsList() {
            const tabs = this.tabs.map(el => {
                return {
                    name: el.value,
                    content: el.name
                };
            });
            return tabs;
        }
    }
};
</script>

<style lang="less">
.eui-v2-color-picker-header {
    padding: 0 14px 12px;

    &__tabs {
        .eui-v2-tabs__header {
            position: relative;
            &.eui-v2-tabs--single {
                padding: 0;
                justify-content: left;
            }
        }

        &__line {
            display: none;
        }
    }
}
</style>
