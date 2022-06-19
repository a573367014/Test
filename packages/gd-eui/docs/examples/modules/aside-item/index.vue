<template>
    <div class="aside-item-demo">
        <div style="width: 298px; margin-top: 20px">
            <ge-aside-item label="文字">
                <template slot="content">
                    <div class="item-content">
                        <img
                            :draggable="false"
                            v-for="i in 8"
                            :key="i"
                            src="https://gd-ai-application.dancf.com/temp/ddf04b9a4848fe8ee773ef3d77f6eb9f.png?x-oss-process=image/format,webp"
                        />
                    </div>
                </template>
            </ge-aside-item>
        </div>
    </div>
</template>

<script>
import { GeAsideItem } from '../../../../src';
import '../../../../es/components/modules/aside-item/style';

export default {
    name: 'test-aside-item',
    components: {
        GeAsideItem,
    },
};
</script>

<style lang="less">
.aside-item-demo {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    .item-content {
        display: flex;
        flex-wrap: wrap;
        img {
            width: 64px;
            height: 64px;
            margin: 0 8px 8px 0;
            border-radius: 4px;
            &:nth-child(4n + 4) {
                margin: 0;
            }
        }
    }
}
</style>
