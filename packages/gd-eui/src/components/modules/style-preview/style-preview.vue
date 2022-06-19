<template>
    <div class="style-preview" @click="$emit('click')">
        <div class="style-preview__wrap">
            <div class="style-preview__image" :style="imageStyle">
                <ge-icon
                    class="style-preview__image__icon"
                    v-show="!(preview && preview.length)"
                    type="plus"
                />
            </div>
            <div class="style-preview__title">{{ title }}</div>
        </div>

        <ge-icon class="style-preview__arrow" type="BigChevronDown" />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';

/**
 * @title 组件名
 * GeStylePreview
 */
/**
 * @title 描述
 * 样式展示预览、描述预览的通用组件，默认为添加样式展示
 */
/**
 * @title 使用场景
 * @dot 字体样式属性
 * @dot 背景样式属性
 * @dot 表格样式属性
 * @dot 等预览性组件
 */
export default defineComponent({
    name: 'GeStylePreview',
    props: {
        // 样式展示预览，可以为图片 url、css 颜色样式值、渐变样式
        preview: {
            type: String,
            default: '',
        },
        // 描述
        title: {
            type: String,
            default: '',
        },
    },
    emits: [
        /**
         * 点击样式的时候回调
         */
        'click',
    ],
    setup(props) {
        const imageStyle = computed(() => {
            const preview = props.preview;
            if (
                preview.indexOf('http://') === 0 ||
                preview.indexOf('https://') === 0 ||
                preview.indexOf('//') === 0
            ) {
                return {
                    backgroundImage: `url(${preview})`,
                };
            }

            return `background: ${preview}`;
        });
        return {
            imageStyle,
        };
    },
});
</script>
