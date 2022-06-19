<template>
    <div class="eui-v2-image-list">
        <ul
            class="eui-v2-image-list__inner"
            :style="{
                margin: `-${gapY}px -${gapX + scrollBarWidth}px 0 -${gapX}px`,
            }"
        >
            <li
                v-for="(item, idx) in list"
                :key="idx"
                class="eui-v2-image-list__item"
                :class="{
                    'eui-v2-image-list__item_border': withBorder,
                    disabled: item.disabled,
                    selected: value && (value === item || value === item.url),
                }"
                :style="{
                    width: imageWidth + 'px',
                    height: imageHeight + 'px',
                    marginLeft: gapX + 'px',
                    marginTop: gapY + 'px',
                    backgroundImage: getCssBackground(item),
                    backgroundColor: item.color || '#fff',
                }"
                @click="onItemClick(item, idx)"
            />
        </ul>
    </div>
</template>

<script>
import { ossUrl } from '../../utils/oss';

const reURL =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
const SCROLL_BAR_WIDTH = 20;

export default {
    model: {
        event: 'change',
        prop: 'value',
    },

    props: {
        list: {
            type: Array,
            default() {
                return [];
            },
        },
        value: {
            type: String,
            default: '',
        },
        imageWidth: {
            type: Number,
            default: 62,
        },
        imageHeight: {
            type: Number,
            default: 35,
        },
        gapX: {
            type: Number,
            default: 7,
        },
        gapY: {
            type: Number,
            default: 9,
        },
        withBorder: {
            type: Boolean,
            default: false,
        },
        ossResizeUrl: {
            type: Boolean,
            default: false,
        },
    },

    data() {
        return {
            scrollBarWidth: SCROLL_BAR_WIDTH,
        };
    },

    mounted() {},

    methods: {
        getCssBackground(item) {
            let url = item.url || item;
            url = url
                ? reURL.test(url)
                    ? `url(${
                          this.ossResizeUrl
                              ? ossUrl(url, { width: this.imageWidth, height: this.imageHeight })
                              : url
                      })`
                    : url
                : null;
            return url;
        },
        onItemClick(item, idx) {
            this.$emit('change', item.url || item, idx);
        },
    },
};
</script>

<style lang="less">
.eui-v2-image-list {
    overflow-x: hidden;
    &__inner {
        display: flex;
        padding: 0;
        overflow: auto;
        list-style: none;

        flex-wrap: wrap;
    }

    &__item {
        box-sizing: border-box;
        border-radius: 4px;
        background-repeat: no-repeat;
        background-position: 50% 50%;
        background-size: cover;

        &:not(.disabled) {
            cursor: pointer;
        }

        &.disabled {
            background-color: #f8fafc;
            opacity: 0.1;
        }

        &::after {
            content: '';
            display: block;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            border-radius: 4px;
        }

        &:hover:not(.disabled),
        &.selected:not(.disabled) {
            &::after {
                border: 2px solid #005bf9;
            }
        }
    }
}
</style>
