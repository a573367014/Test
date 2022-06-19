<template>
    <div>
        <div class="wrap">
            空闲状态：
            <GeMusicItem
                :title="title"
                :duration="duration"
                :status="0"
                :preview="preview"
                @play="onplay"
                @pause="onpause"
                @add="onadd"
            />
        </div>
        <div class="wrap">
            暂停状态：
            <GeMusicItem
                :title="title"
                :duration="duration"
                :status="1"
                :preview="preview"
                @play="onplay"
                @pause="onpause"
                @add="onadd"
            />
        </div>
        <div class="wrap">
            加载状态：
            <GeMusicItem
                :title="title"
                :duration="duration"
                :status="status"
                :preview="preview"
                @play="onplay"
                @pause="onpause"
                @add="onadd"
            />
        </div>
        <div class="wrap">
            播放状态：
            <GeMusicItem
                :title="title"
                :duration="duration"
                :status="3"
                :preview="preview"
                @play="onplay"
                @pause="onpause"
                @add="onadd"
            />
        </div>
    </div>
</template>

<script>
import { GeMusicItem } from '../../../../src';
import '../../../../es/components/modules/music-item/style';

export default {
    name: 'test-music-item',
    components: {
        GeMusicItem,
    },
    data() {
        return {
            title: '抖音热门100首',
            duration: 30000,
            status: 2,
            preview:
                'https://img1.baidu.com/it/u=269890824,2691178002&fm=253&fmt=auto&app=120&f=JPEG?w=507&h=500',
        };
    },
    methods: {
        onplay() {},
        onpause() {},
        onadd() {},
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
