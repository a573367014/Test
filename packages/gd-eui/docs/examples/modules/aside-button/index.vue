<template>
    <div class="ge-aside-button-test">
        普通使用
        <ge-aside-button />
        选中状态
        <ge-aside-button :activated="true" />
        禁用状态
        <ge-aside-button :showMask="true" />
    </div>
</template>

<script>
import { GeAsideButton } from '../../../../src';
import '../../../../es/components/modules/aside-button/style';

export default {
    name: 'ge-aside-button-test',
    components: {
        GeAsideButton,
    },
};
</script>

<style lang="less">
.ge-aside-button-test {
    width: 70px;
}
</style>
