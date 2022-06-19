<template>
    <div class="eui-v2-group-control">
        <div class="row">
            <div class="col">
                <button class="alignment-top" @click="align('alignmentTop')" />
                <button class="alignment-middle" @click="align('alignmentMiddle')" />
                <button class="alignment-bottom" @click="align('alignmentBottom')" />
            </div>
            <div class="col">
                <button class="alignment-left" @click="align('alignmentLeft')" />
                <button class="alignment-center" @click="align('alignmentCenter')" />
                <button class="alignment-right" @click="align('alignmentRight')" />
            </div>
        </div>
        <div class="editor-panel-split" v-if="allowDistribution" />
        <div class="row" v-if="allowDistribution">
            <button class="icon-wrapper distribution-btn" @click="align('distributionMiddle')">
                <div class="icon distribution-vertical" style="font-size: 13px"></div>
                {{ $tsl('垂直分布') }}
            </button>
            <div class="pipe" />
            <button class="icon-wrapper distribution-btn" @click="align('distributionCenter')">
                <div class="icon distribution-horizontal" style="font-size: 13px"></div>
                {{ $tsl('水平分布') }}
            </button>
        </div>
    </div>
</template>

<script>
import { i18n } from '../i18n';

export default {
    props: {
        editor: { type: Object, required: true },
    },
    computed: {
        allowDistribution() {
            return this.editor.selectedElements.length >= 3;
        },
    },
    methods: {
        $tsl: i18n.$tsl,
        align(dir) {
            if (this.editor.currentElement.type !== '$selector') {
                return;
            }
            this.editor.alignmentElements(dir);
        },
    },
};
</script>

<style lang="less">
.group-button-mixin(@name) {
    @path: './icons/@{name}.svg';
    &.@{name} {
        background: svg-load(@path, fill=#6C788C) center no-repeat;
        border: 0;
        outline: 0;
        cursor: pointer;
        &.active {
            background-image: svg-load(@path, fill= @primary-color);
        }
    }
}

.eui-v2-group-control {
    margin-top: 24px;
    margin-bottom: 24px;
    width: 210px;
    border-radius: 4px;
    border: 1px solid #dfe3ed;
    box-sizing: border-box;
    .editor-panel-split {
        margin: auto;
        width: 182px;
        height: 1px;
        background: #e9ebf2;
    }
    .row {
        box-sizing: border-box;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 210px;
        height: 48px;
        padding: 0 14px;
        .col {
            height: 100%;
        }
    }
    .pipe {
        width: 1px;
        height: 20px;
        background: #e9ebf3;
    }
    button {
        width: 22px;
        height: 100%;
        padding: 0;
        .group-button-mixin(alignment-bottom);
        .group-button-mixin(alignment-center);
        .group-button-mixin(alignment-left);
        .group-button-mixin(alignment-middle);
        .group-button-mixin(alignment-right);
        .group-button-mixin(alignment-top);
    }
    .icon {
        width: 16px;
        height: 16px;
        margin-right: 6px;
        .group-button-mixin(distribution-horizontal);
        .group-button-mixin(distribution-vertical);
    }
    .icon-wrapper {
        display: flex;
        justify-content: space-around;
        align-items: center;
        width: 78px;
        height: 100%;
        border: 0;
        border-radius: 4px;
        outline: 0;
        background: white;
        cursor: pointer;
        font-size: 13px;
    }

    .distribution-btn {
        font-size: 14px;
        &[disabled] {
            .eui-v2-icon {
                opacity: 0.3;
            }
        }
    }
}
</style>
