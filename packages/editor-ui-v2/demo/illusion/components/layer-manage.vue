<template>
    <div class="layer-manage">
        <div class="layer-manage-head" :style="headStyle">
            <h4>{{ title }}</h4>
            <pop-base class="layer-acions-pop">
                <eui-v2-icon name="plus"></eui-v2-icon>
                <select-panel slot="panel" :onSelect="onLayerSelect" :list="layerActions" />
            </pop-base>
        </div>
        <div class="layer-manage-select">
            <blend-select :list="list" :onSelect="onSelect"></blend-select>
        </div>

        <div class="layer-manage-list">
            <div
                draggable
                @dragstart="dragStart(item, $event)"
                @dragover="dragOver(item, $event)"
                @dragleave="dragLeave(item, $event)"
                @dragend="dragEnd(item, $event)"
                @click="setCurrentSelect(item)"
                class="layer-manage-list--item"
                :class="{
                    active: item.active,
                    hover: item.hover
                }"
                v-for="(item, index) in layers"
                :key="index"
            >
                <pop-base class="layer-manage-list--preview">
                    <div class="layer-manage-list--view" :style="getPreviewStyle(item)"></div>
                    <color-picker
                        slot="panel"
                        v-if="item.type === 'color'"
                        :value.sync="item.color"
                        :enable-alpha="false"
                        format="rgb"
                        @change="onColorChange"
                    />
                </pop-base>
                <div class="layer-manage-list--label">{{ item.type === 'color' ? '纯色层' + item.index : '图层' + item.index }}</div>
                <eui-v2-icon @click.native="changeLayer(item)" :name="item.use ? 'plus' : 'pen'"></eui-v2-icon>
            </div>
        </div>
    </div>
</template>

<script>
import BlendSelect from './blend-select';
import SelectPanel from './select-panel';
import { PopBase, ColorPicker } from '../../src';

export default {
    components: {
        BlendSelect,
        SelectPanel,
        PopBase,
        ColorPicker,
    },

    props: {
        editor: {
            type: Object,
        },
        list: {
            type: Array,
            default: () => [],
        },

        title: {
            type: String,
            default: '图层管理'
        },

        headBackgroundColor: {
            type: String,
            default: '#EDF2F8'
        }
    },

    data() {
        return {
            currentHoverItem: null,
            currentSelectItem: null,
            currentDragItem: null,
            layers: [{
                type: 'color',
                color: '#FFFFF0',
                index: 0,
                use: true,
                active: false,
                hover: false,
            }, {
                type: 'image',
                url: 'https://st0.dancf.com/csc/32/topics/2242/20190414-172225-0ee5.png',
                index: 0,
                use: false,
                active: false,
                hover: false,
            }, {
                type: 'image',
                url: 'https://st0.dancf.com/csc/32/topics/2651/20190413-104149-0a67.png',
                index: 1,
                use: true,
                active: false,
                hover: false,
            }, {
                type: 'color',
                color: '#000011',
                index: 10,
                use: false,
                active: false,
                hover: false,
            }],
            layerActions: [
                {
                    label: '新建图层',
                    type: 'create',
                },
                {
                    label: '新建纯色图层',
                    type: 'createColor',
                },
                {
                    label: '上传图片',
                    type: 'upload',
                }
            ]
        };
    },

    computed: {
        headStyle() {
            return {
                backgroundColor: this.headBackgroundColor,
            };
        }
    },

    methods: {
        deleteEvent(event) {
            const { keyCode } = event;
            if(this.currentSelectItem && keyCode === 8) {
                const index = this.layers.findIndex(item => item === this.currentSelectItem);

                if(index !== -1) {
                    this.layers.splice(index, 1);
                }
            }
        },
        getNodeIndex() {

        },
        setCurrentSelect(item) {
            item.active = !item.active;
            if(item === this.currentSelectItem) {
                this.currentSelectItem = null;
                return;
            }

            this.currentSelectItem = item;
        },
        dragStart(item) {
            this.currentDragItem = item;
        },
        dragLeave(item) {
            item.hover = false;
        },
        dragEnd() {
            const { currentHoverItem, currentDragItem } = this;
            const index = this.layers.findIndex(layer => layer === currentHoverItem);
            const currentIndex = this.layers.findIndex(layer => layer === currentDragItem);

            if(index !== -1) {
                if(currentHoverItem.type === currentDragItem.type) {
                    const tempIndex = currentHoverItem.index;
                    currentHoverItem.index = currentDragItem.index;
                    currentDragItem.index = tempIndex;
                }
                this.$set(this.layers, currentIndex, currentHoverItem);
                this.$set(this.layers, index, currentDragItem);
            }
            this.currentHoverItem = null;
            this.currentDragItem = null;
        },
        dragOver(item) {
            if(item !== this.currentSelectItem) {
                item.hover = true;
            }

            this.currentHoverItem = item;
        },
        changeLayer(item) {
            item.use = !item.use;
        },
        getPreviewStyle(item) {
            const background = item.type === 'image' ? {
                backgroundImage: `url('${item.url}')`
            } : {
                backgroundColor: item.color
            };

            return background;
        },
        onColorChange(color) {
            console.log(color);
        },

        createImageLayer() {
            console.log(this.editor);
        },

        onLayerSelect(item) {
            switch (item.type) {
            case 'create':
                // 复制当前操作的图片当作图层
                this.createImageLayer();
                break;
            case 'createColor':
                this.createColorLayer();
                break;
            default:
                // 上传新的图片当作图层
                this.createImageLayer();
                break;
            }
            console.log(item);
        },
        onSelect(item) {
            console.log(item);
        }
    },

    mounted() {
        document.body.addEventListener('keydown', this.deleteEvent);
    },

    destroy() {
        document.body.removeEventListener('keydown', this.deleteEvent);
    }
};
</script>

<style lang="less">
.layer-manage {
    width: 100%;
    .layer-manage-head {
        position: relative;
        display: flex;
        justify-content: space-between;
        padding: 18px 16px;
        > h4 {
            margin: 0;
            font-size: 15px;
        }

        .eui-v2-icon {
            margin-top: 3px;
            cursor: pointer;
        }
    }

    .layer-manage-select {
        width: 100%;
        height: 38px;
        background: #ffffff;
        border: 1px solid #DFE3ED;
    }
    .layer-acions-pop {
        width: 15px;
        height: 15px;
        .eui-v2-pop-panel {
            top: 10px;
            left: -120px;
            width: 130px;
            border-radius: 4px;
            border: none;
            background-color: white;
            padding-left: 0;
            margin: 0;
            height: auto;
            box-shadow: 0px 4px 6px 0px rgba(0, 0, 0, 0.06);
            &:hover {
                border: none;
            }
        }
        .eui-v2-pop-label {
            border: none;
            padding-left: 0;
            margin: 0;
            height: auto;
            &:after {
                content: none;
            }
        }
    }
    .layer-manage-list {
        height: 187px;
        background: #BEC3C9;
        overflow-y: auto;
        .layer-manage-list--item {
            display: flex;
            align-items: center;
            cursor: move;
            width: 100%;
            height: 55px;
            box-sizing: border-box;
            padding: 0 18px;
            background-color: white;
            border: 1px solid #DFE3ED;
             .eui-v2-icon {
                cursor: pointer;
                display: none;
            }
            &.hover {
                border-color: blue;
            }
            &:hover, &.active {
                background-color: #f9f9f9;
                .eui-v2-icon {
                    display: block;
                }
            }
            .layer-manage-list--label {
                width: 160px;
                font-size: 13px;
            }
            .gd-color-picker {
                z-index: 2;
            }
            .layer-manage-list--preview {
                width: 36px;
                height: 36px;
                margin-right: 16px;
                cursor: pointer;
                .layer-manage-list--view {
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    border-radius: 4px;
                }
                .eui-v2-pop-label {
                    padding: 0;
                    margin: 0;
                    border: none;
                    height: 100%;
                    width: 100%;
                    &::after {
                        content: none;
                    }
                }
                img {
                    display: inline-block;
                    width: 100%;
                    object-fit: cover;
                }
            }
        }
    }
}
</style>
