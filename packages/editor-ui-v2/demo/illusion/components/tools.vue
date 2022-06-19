<template>
    <div class="tools-wrap">
        <div class="tools">
            <div class="tool-item">
                <span class="label">背景色</span>
                <span class="color"></span>
            </div>
            <div class="tool-item">
                <span class="label">人像</span>
            </div>
            <div class="tool-item">
                <span class="label">风光</span>
            </div>
            <div class="tool-item">
                <span class="label">美食</span>
            </div>
            <div class="tool-item">
                <span class="label">图片1</span>
            </div>
            <div class="tool-item">
                <span class="label">+ 上传</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        editor: {
            type: Object
        }
    }
};
</script>

<style scoped lang="less">
.tools-wrap {
    position: fixed;
    display: flex;
    justify-content: center;
    width: calc(~'100% - 280px');;
    height: 40px;
    bottom: 36px;
    left: 0;
    .tools {
        width: auto;
        display: flex;
        align-items: center;
    }
    .tool-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        background-color: #333333;
        color: #FFFFFF;
        font-size: 14px;
        padding: 4px 13px;
        border-radius: 4px;
        min-width: 70px;
        text-align: center;
        cursor: pointer;
        & + .tool-item {
            margin-left: 6px;
        }
        .label + span {
            margin-left: 20px;
        }
        .color {
            display: block;
            width: 18px;
            height: 18px;
            border:1px solid #555555;
            background-color: black;
        }
        &:hover {
            background-color: #2110FF;
        }
    }
}
</style>
