<template>
    <ComponentDescGroup>
        <ComponentDescWrap title="加载更多" desc="">
            <div class="list-wrap">
                <div v-for="item in list" :key="item">这是一个item：{{ item }}</div>
                <GeLoadMore :loadMore="loadMore" />
            </div>
        </ComponentDescWrap>

        <ComponentDescWrap title="加载更多" desc="加载更多，自定义样式">
            <div class="list-wrap">
                <div v-for="item in list" :key="item">这是一个item：{{ item }}</div>
                <GeLoadMore :loadMore="loadMore">
                    <template slot="loading">
                        <div>加载更多...</div>
                    </template>
                </GeLoadMore>
            </div>
        </ComponentDescWrap>

        <ComponentDescWrap title="无更多数据" desc="可自定义样式">
            <GeLoadMore ref="loadMoreRef3" :loadMore="loadMore3" :isNoMore="true">
                <template slot="nomore">
                    <span @click="loadMore3Click">
                        <span>nomore</span>
                        <a>重新加载</a>
                    </span>
                </template>
            </GeLoadMore>
        </ComponentDescWrap>

        <ComponentDescWrap title="加载错误" desc="可自定义样式">
            <GeLoadMore :loadMore="loadMore4" :isError="true">
                <template slot="error">
                    <div>error，点击重新加载</div>
                </template>
            </GeLoadMore>
        </ComponentDescWrap>
    </ComponentDescGroup>
</template>

<script lang="ts">
import ComponentDescGroup from '../ui/component-desc-group.js';
import ComponentDescWrap from '../ui/component-desc-wrap.vue';
import { GeLoadMore } from '../../src';
import '../../src/components/high-level/load-more/style';

export default {
    name: 'demo-load-more',
    components: {
        ComponentDescGroup,
        ComponentDescWrap,
        GeLoadMore,
    },
    data: () => {
        return {
            list: [1, 2, 3, 4, 5],
        };
    },
    methods: {
        async request() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    for (let index = 1; index < 20; index++) {
                        this.list.push(this.list.length + index);
                    }
                    resolve(1);
                }, 1000);
            });
        },
        async loadMore() {
            await this.request();
        },
        async loadMore3() {
            alert('回调执行loadMore');
        },
        async loadMore4() {
            alert('回调执行loadMore');
        },
        loadMore3Click() {
            this.$refs.loadMoreRef3.reload();
        },
    },
};
</script>

<style lang="less">
.list-wrap {
    height: 150px;
    // background-color: azure;
    overflow: scroll;
}
.load-more-item-wrap {
    padding: 16px;
}
</style>
