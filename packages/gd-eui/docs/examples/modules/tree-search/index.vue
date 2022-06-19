<template>
    <div class="demo">
        <ge-tree-search
            @inputChange="inputChange"
            @treeExpand="treeExpand"
            @treeSelect="treeSelect"
            @inputBlur="inputBlur"
            :treeData="treeData"
            :visibleWordPopover="true"
            :hotWordList="['春风', '节日', '立冬', '晚风']"
        />
    </div>
</template>

<script>
import { GeTreeSearch } from '../../../../src';
import '../../../../es/components/modules/tree-search/style';

const data = [
    {
        title: 'Node1',
        value: '0-0',
        key: '0-0',
        children: [
            {
                value: '0-0-1',
                key: '0-0-1',
                scopedSlots: {
                    // custom title
                    title: 'title',
                },
            },
            {
                title: 'Child Node2',
                value: '0-0-2',
                key: '0-0-2',
                children: [
                    {
                        title: 'Child Node3',
                        value: '0-0-2-1',
                        key: '0-0-2-2',
                    },
                ],
            },
        ],
    },
    {
        title: 'Node2',
        value: '0-1',
        key: '0-1',
    },
];
export default {
    name: 'test-tree-search',
    components: {
        GeTreeSearch,
    },
    data() {
        return {
            treeData: data,
            value: null,
        };
    },
    methods: {
        treeSelect(val) {
            console.log('treeSelect', val);
        },
        treeExpand(expandedKeys) {
            console.log('expandedKeys', expandedKeys);
        },
        inputChange(e) {
            console.log('inputChange', e);
        },
        inputBlur(e) {
            console.log('inputBlur', e);
        },
    },
};
</script>

<style>
.demo {
    width: 240px;
}
</style>
