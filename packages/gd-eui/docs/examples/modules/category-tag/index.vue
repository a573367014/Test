<template>
    <div>
        <div class="wrap">
            <div class="wrap__title">用例1:带标题、三层</div>
            <ge-category-tag
                :title="title"
                :options="options"
                @change="onchange"
                @select="onselect"
            />
        </div>

        <div class="wrap">
            <div class="wrap__title">用例2:无标题、二层</div>
            <ge-category-tag :options="options2" />
        </div>
    </div>
</template>

<script>
import { GeCategoryTag } from '../../../../src';
import '../../../../es/components/modules/category-tag/style';

export default {
    name: 'test-category-tag',
    components: {
        GeCategoryTag,
    },
    data() {
        return {
            title: '分类选择器',
            option1Value: null,
            options: [
                {
                    value: '烤肉',
                    children: [
                        { label: 'KAO烤肉', value: 'KAO' },
                        {
                            title: '韩国烤肉',
                            children: [
                                {
                                    label: '1988炭烤鳗鱼',
                                    value: '1988',
                                },
                                {
                                    label: '辛农园',
                                    value: 'xinnongyuan',
                                },
                            ],
                        },
                    ],
                },
                { label: '火锅', children: [{ label: '八合里', value: 'baheli' }] },
            ],
            options2: [
                {
                    value: '烤肉',
                    children: [
                        { label: 'KAO烤肉', value: 'KAO' },
                        {
                            label: '1988炭烤鳗鱼',
                            value: '1988',
                        },
                    ],
                },
                { label: '火锅', children: [{ label: '八合里', value: 'baheli' }] },
            ],
        };
    },

    methods: {
        onchange: (indexs, obj) => {
            console.log('值改变回调', indexs, obj);
        },
        onselect: (indexs, obj) => {
            console.log('值选中回调', indexs, obj);
        },
    },
};
</script>

<style lang="less">
.wrap {
    &__title {
        font-size: 16px;
    }
}
</style>
