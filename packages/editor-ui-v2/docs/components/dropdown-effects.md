# dropdown-effects 编辑器特效样式面板

:::demo
<style lang="less">
    .demo-panel {
        width: 210px;
    }

    .demo-panel-item {
        margin-bottom: 12px;
    }

    .eui-v2-popup-base {
        z-index: 100;
    }
</style>


<template>
    <div class="demo-panel">
        <div class="demo-panel-item">
            <eui-v2-dropdown-effects
                :effects="effects"
                :current-effect="effect"
                @change="onChange"
                @clear="clearEffect"
                @active="onActive"
                @inactive="onInactive"/>
        </div>
        <div>
            <eui-v2-dropdown-effects
                :effects="effects"
                :current-effect="noEffect2"
                @change="onChange"
                @clear="clearEffect"/>
        </div>
    </div>
</template>

<script>

export default {
    components: {
    },
    data() {
        return {
            effects: {
                '平面特效': [{"id":1,"name":"1","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":2,"name":"2","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":3,"name":"3","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":4,"name":"4","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":5,"name":"5","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":6,"name":"6","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":7,"name":"7","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":8,"name":"8","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":9,"name":"9","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":10,"name":"10","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":11,"name":"11","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":12,"name":"12","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":13,"name":"13","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":14,"name":"14","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":15,"name":"15","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":16,"name":"16","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":17,"name":"17","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":18,"name":"18","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":19,"name":"19","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}},{"id":20,"name":"20","preview":{"url":"https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png"}}]
            },
            effect: {
                id: 8,
                name: '8',
                preview: {
                    url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
                }
            },
            defaultEffect: {
                id: 9,
                name: '8',
                preview: {
                    url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
                }
            },
            defaultEffect2: {
            },
            noEffect: null,
            noEffect2: [null, null],
            multipleEffects: [{
                id: 8,
                name: '8',
                preview: {
                    url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
                }
            }, {
                id: 7,
                name: '8',
                preview: {
                    url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
                }
            }],
            multipleEffects1: [null, {
                id: 7,
                name: '8',
                preview: {
                    url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
                }
            }],
            multipleEffects2: [{
            }, {
                id: 7,
                name: '8',
                preview: {
                    url: 'https://st-gdx.dancf.com/materials/5145/shots/20180726-143312-we7vm.png'
                }
            }],
            multipleEffects3: [null, {
            }]
        }
    },
    methods: {
        onChange(effect) {
            this.effect = effect;
        },
        clearEffect() {
            this.effect = null;
        },
        onInactive() {
            console.log('onInactive');
        },
        onActive() {
            console.log('inActive');
        }
    },
}
</script>

:::