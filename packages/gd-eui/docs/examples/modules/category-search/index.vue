<template>
    <div class="test-category-search-demo">
        <ge-category-search
            :options="options"
            :visibleWordPopover="true"
            @inputChange="handleInputChange"
            @inputBlur="handleInputBlur"
            :hotWordList="['春风', '节日', '立冬', '晚风']"
        />
    </div>
</template>

<script>
import { GeCategorySearch } from '../../../../src';
import '../../../../es/components/modules/category-search/style';

export default {
    name: 'test-category-search',
    components: {
        GeCategorySearch,
    },
    data() {
        return {
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
        };
    },
    methods: {
        handleInputChange(e) {
            console.log('handleInputChange', e);
        },
        handleInputBlur(e) {
            console.log('handleInputBlur', e);
        },
    },
};
</script>

<style></style>
