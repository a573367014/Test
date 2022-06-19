<template>
    <savingSvg :class="cmtClass" v-if="name === 'saving'"></savingSvg>

    <loaderSvg :class="cmtClass" v-else-if="name === 'loader'"></loaderSvg>

    <svg v-else class="eui-v2-icon" :class="cmtClass" width="1em" height="1em">
        <use :xlink:href="iconId" />
    </svg>
</template>

<script>
import savingSvg from './icon-components/saving.vue';
import loaderSvg from './icon-components/loader.vue';

let loaded = false;
import(/* webpackChunkName: "editor-ui-v2-icon-sprite" */ './icon-sprite').then((module) => {
    const loadSprite = () => {
        if (!loaded) {
            const svgSprite = module.default;
            loaded = true;
            const div = document.createElement('div');
            div.id = '__EUI_SVG_ICONS_2__';
            div.style.display = 'none';
            div.innerHTML = svgSprite;

            document.body.appendChild(div, document.body.firstChild);
        }
    };

    loadSprite();
});

export default {
    components: {
        savingSvg,
        loaderSvg,
    },
    props: {
        name: {
            type: String,
            required: true,
        },
        prefix: {
            type: String,
            default: 'eui-v2-icon--',
        },
    },
    computed: {
        iconId() {
            const { name, prefix } = this;
            return `#${prefix}${name}`;
        },
        cmtClass() {
            return this.prefix + this.name;
        },
    },
};
</script>

<style lang="less">
.eui-v2-icon {
    fill: currentColor;
}
</style>
