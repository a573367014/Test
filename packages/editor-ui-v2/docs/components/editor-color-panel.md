# editor-color-panel 编辑器颜色面板

:::demo
<style lang="less">
    .demo-panel {
        width: 210px;
    }
    .content {
        height: 500px;
        overflow: auto;
    }
</style>


<template>
    <div class="demo-panel">
        <eui-v2-panel>
            <eui-v2-sub-panel>
                <eui-v2-editor-color-panel
                    v-if="test"
                    :colors="colors"
                    @change="onChange"
                    @preset-click="onPresetChange"
                    enable-alpha
                    format="prgb"
                    :tabs="tabs"
                    :preset-colors="presetColors"
                    :material-presets="presets"
                    :gradient="{angle: 30, stops: [{color: 'red', offset: 0}, {color: '#000', offset: 1}]}"
                    :gradient-max-stop="3"
                />
            </eui-v2-sub-panel>
        </eui-v2-panel>
    </div>
</template>

<script>
const presets = [{value: '', images: [    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-623d.jpg',
    'https://st-gdx.dancf.com/gaodingx/83883312/design/20190621-105030-38e8.png',
    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-70d1.jpg',
    'https://st-gdx.dancf.com/gaodingx/17/design/three/20190530-210836-f745.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-d74c.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-2206.jpg',
    'https://st-gdx.dancf.com/gaodingx/210/design/three/20190628-120125-4005.jpg',]}]

export default {
    components: { },
    data() {
        return {
            colors: [
                'red',
                'white',
                'yellow',
                'black',
                'pink',
                '#333'
            ],
            model: {},
            list: [],
            tabs: [{
                name: '颜色',
                value: 'color'
            }, {
                name: '贴图',
                value: 'map'
            }, {
                name: '渐变',
                value: 'gradient'
            }],
            presets,
            test: true
        }
    },
    computed: {
        presetColors() {
            return [];
        }
    },
    methods: {
        onChange(event) {
            const colors = this.colors;
            const { index, type, data } = event;
            console.log(event);
            colors.splice(index, 1, data);
        },
        onPresetChange(colors) {
            console.log(colors)
        }
    }
}
</script>
:::