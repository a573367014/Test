<template>
    <div class="filter-select-pop">
        <pop-base class="filter-select-container">
            <div class="filter-select-label">
                <div class="filter-select-preview" :style="previewStyle"></div>
                <div class="filter-select-name"></div>
            </div>
            <div slot="panel">
            </div>
        </pop-base>
    </div>
</template>

<script>
import PopBase from '../../src/pop-base';

export default {
    components: {
        PopBase
    },

    props: {
        list: {
            type: Array,
            default: () => []
        }
    },

    computed: {
        previewStyle() {
            const { currentSelect } = this;

            return {
                backgroundImage: `url(${currentSelect})`,
                backgroundSize: 'cover'
            };
        }
    },

    data() {
        return {
            currentSelect: null
        };
    }
};
</script>

<style lang="less">
.filter-select-pop {
    border-radius: 4px;
    .filter-select-container {
        display: flex;
        flex-direction: column;
        .filter-select-label {
            display: flex;
            width: 100%;
            height: 70px;
        }
    }
    .eui-v2-pop-label {
        border: 0;
    }
}
</style>
