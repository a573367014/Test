<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="普通使用" desc="">
            <div class="select-item-list-wrap">
                <div>独立列表：</div>
                <GeStyleSelectItemList
                    :list="list"
                    @select="handleSelectItem"
                    :selectItem="selectItem"
                />

                <div style="margin-top: 24px">分段式：</div>
                <GeStyleSelectItemList
                    :list="segmentList"
                    @select="handleSelectItem2"
                    :selectItem="selectItem2"
                />
            </div>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script>
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeStyleSelectItemList } from '../../src';
import '../../src/components/modules/style-select-item-list/style';

const simpleSegment = [
    {
        src: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20200922-184525-ffde.png?x-oss-process=image/resize,w_119,h_119,m_fill/interlace,1,image/format,webp',
        title: '电影C1',
        id: 0,
        showCopyRight: false,
        styleSliderList: [
            {
                // label: '强度',
                key: 's1',
                value: 12,
                max: 100,
            },
        ],
    },
    {
        src: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20200922-184607-887a.png?x-oss-process=image/resize,w_119,h_119,m_fill/interlace,1,image/format,webp',
        title: '电影C2',
        id: 1,
        showCopyRight: false,
        styleSliderList: [
            {
                // label: '强度',
                key: 's1',
                value: 80,
                max: 80,
            },
        ],
    },
    {
        src: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20200922-183930-1513.png?x-oss-process=image/resize,w_119,h_119,m_fill/interlace,1,image/format,webp',
        title: '电影C1',
        id: 2,
    },
    {
        src: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20200922-184457-1fa9.png?x-oss-process=image/resize,w_119,h_119,m_fill/interlace,1,image/format,webp',
        title: '电影C2',
        id: 3,
    },
];

const simpleSegment2 = [
    {
        src: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20200923-154925-349c.png?x-oss-process=image/resize,w_119,h_119,m_fill/interlace,1,image/format,webp',
        title: '电影C1',
        id: 0,
        styleSliderList: [
            {
                label: '强度',
                key: 's1',
                value: 12,
                max: 100,
            },
            {
                label: '锐度',
                key: 's2',
                value: 12,
                max: 100,
            },
        ],
    },
];

export default {
    name: 'demo-style-select-item-list',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeStyleSelectItemList,
    },
    data: () => {
        return {
            segmentList: [
                {
                    title: '清晰',
                    segment: simpleSegment,
                },
                {
                    title: '激情',
                    segment: [...simpleSegment2],
                },
            ],
            list: simpleSegment,
            selectItem: null,
            selectItem2: null,
        };
    },
    mounted() {
        // console.log(this.selectItem);
    },
    methods: {
        handleSelectItem(item) {
            console.log(item);
            this.selectItem = item;
        },
        handleSelectItem2(item) {
            this.selectItem2 = item;
        },
    },
};
</script>

<style lang="less">
.select-item-list-wrap {
    width: 300px;
}
</style>
