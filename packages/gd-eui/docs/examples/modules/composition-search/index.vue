<template>
    <div class="ge-tree-search">
        <ge-composition-search :leftValue="leftValue">
            <template slot="leftPopoverContent">
                <g-tree :tree-data="treeData"></g-tree>
            </template>
            <template slot="rightInputSlot">
                <div class="ge-tree-search__input">
                    <g-input ref="inputEl">
                        <ge-icon slot="prefix" type="search" />
                    </g-input>
                </div>
            </template>
        </ge-composition-search>
    </div>
</template>

<script>
import { GeCompositionSearch } from '../../../../src';
import { Input, Tree } from '@gaoding/gd-antd';
import '@gaoding/gd-antd/es/input/style/';
import '@gaoding/gd-antd/es/tree/style/';
import '../../../../es/components/modules/composition-search/style';

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
    name: 'test-composition-search',
    components: {
        GeCompositionSearch,
        GInput: Input,
        GTree: Tree,
    },
    data() {
        return {
            treeData: data,
            leftValue: null,
        };
    },
};
</script>

<style></style>
