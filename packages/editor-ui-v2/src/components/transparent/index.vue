<template>
    <div :class="bem()"><slot /></div>
</template>
<script>
export default {
    name: 'eui-v2-transparent'
};
</script>
<style lang="less">
.eui-v2-transparent {
    background-color: transparent;
    @size: 6px;
    background-image:
    linear-gradient(45deg, #00000040, #00000040),
    linear-gradient(45deg,#eee 25%,transparent 0,transparent 75%,#eee 0,#eee),
    linear-gradient(45deg,#eee 25%,#fff 0,#fff 75%,#eee 0,#eee);
    background-size: @size * 2 @size * 2;
    background-position: 0 0 , 0 0, @size @size;
}
</style>
