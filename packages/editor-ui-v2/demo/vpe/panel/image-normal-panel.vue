<style lang="less">

</style>

<template>
    <div class="image-normal-panel">
        <div class="eui-v2-panel-form">
            <div class="eui-v2-panel-form__item">
                <eui-v2-panel>
                    <eui-v2-sub-panel>
                        <EditorEffects
                            :disabled="isNinePatch"
                            :effects="effects"
                            :editor="editor"
                            :get-material="getMaterial"
                            clear />
                    </eui-v2-sub-panel>
                </eui-v2-panel>
            </div>
        </div>
        <div class="eui-v2-panel-form">
            <div class="eui-v2-panel-form__label">
                图片
            </div>
            <!-- 写入 categroy -->
            <div class="eui-v2-panel-form__item">
                <eui-v2-input
                    v-if="!isSelector"
                    v-model="tag"
                    as-ref-width
                    block>
                    <template v-slot:dropdown="dropdown">
                        <eui-v2-dropdown-menus>
                            <eui-v2-dropdown-menu
                                v-for="(category, key) in imageCategories"
                                :key="key"
                                :activated="category === tag"
                                @click="selectCategory(key, dropdown)">
                                {{ category }}
                            </eui-v2-dropdown-menu>
                        </eui-v2-dropdown-menus>
                    </template>
                </eui-v2-input>
            </div>
            <!-- 元素转换 -->
            <div class="eui-v2-panel-form__item">
                <eui-v2-dropdown-button style="width: 100%" >
                    {{converTypes[curType]}}
                    <template v-slot:dropdown="dropdown">
                        <eui-v2-dropdown-menus>
                            <eui-v2-dropdown-menu
                                v-for="(name, key) in converTypes"
                                :key="key"
                                :activated="curType === key"
                                @click="converElement(key, dropdown)">
                                {{name}}
                            </eui-v2-dropdown-menu>
                        </eui-v2-dropdown-menus>
                    </template>
                </eui-v2-dropdown-button>
            </div>
            <div class="eui-v2-panel-form__item eui-v2-panel-form__item--row" v-if="!isNinePatch">
                <div class="eui-v2-panel-form__item--col">
                    <eui-v2-button
                        block
                        :disabled="isEditing"
                        @click="replaceImage()">
                        替换
                    </eui-v2-button>
                </div>
                <div class="eui-v2-panel-form__item--col">
                    <eui-v2-button block @click="showEditor" :disabled="isEditing || isSelector">裁剪</eui-v2-button>
                </div>
            </div>
            <div class="eui-v2-panel-form__item eui-v2-panel-form__item--row">
                <div class="eui-v2-panel-form__item--col">
                    <eui-v2-button block :disabled="isEditing" @click="flip('x')">水平翻转</eui-v2-button>
                </div>
                <div class="eui-v2-panel-form__item--col">
                    <eui-v2-button block :disabled="isEditing" @click="flip('y')">垂直翻转</eui-v2-button>
                </div>
            </div>
            <div class="eui-v2-panel-form__item">
                <eui-v2-panel>
                    <eui-v2-range-picker
                        label="不透明度"
                        :label-width="58"
                        :min="0"
                        :max="100"
                        :value="elem.opacity * 100"
                        :disabled="isEditing"
                        @change="elem.opacity = $event / 100"/>
                </eui-v2-panel>
            </div>
            <div class="eui-v2-panel-form__item">
                <EditorElementBar :editor="editor"/>
            </div>
        </div>
    </div>
</template>

<script>
import { EditorEffects, EditorElementBar } from '@/src';
import imageEffects from '../image-effect-preview';
import getMaterial from '../effect-content';

export default {
    components: {
        EditorElementBar,
        EditorEffects
    },
    props: {
        editor: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            converType: 'image',
            converTypes: {
                'image': '无功能',
                'mask': '图片容器',
                'ninePatch': '智能拉伸',
            },
            imageCategories: {
                'mainImg': '主图',
                'QRCODE': '二维码图框',
                'backImg': '背景图',
                'logo': 'LOGO'
            },
            getMaterial,
            effects: {
                '特效': imageEffects
            },
        };
    },
    computed: {
        isNinePatch() {
            return this.curType === 'ninePatch';
        },
        curType() {
            const editType = {
                '$masker': 'mask',
                '$croper': 'image'
            }
            return editType[this.elem.type] || this.elem.type;
        },
        elem() {
            return this.editor.currentSubElement || this.editor.currentElement || this.editor.crop || {};
        },
        elements() {
            return this.isSelector ? this.elem.elements : [this.elem];
        },
        isSelector() {
            return this.elem.type === '$selector';
        },
        tag: {
            get() {
                const elem = this.editor.currentCropElement || this.elem;
                const { imageCategories } = this;
                const category = elem.category;
                if(imageCategories[category]) {
                    return imageCategories[category];
                }
                return category || '无标签';
            },
            set(value) {
                const { imageCategories } = this;
                Object.getOwnPropertyNames(imageCategories).forEach(key => {
                    if(imageCategories[key] === value) {
                        value = key;
                    }
                });
                this.editor.changeElement({ 'category': value }, this.elem);
            }
        },
        isEditing() {
            return this.elem.$editing;
        },
        opacity() {
            return Math.max.apply(Math, this.elements.map(element => element.opacity)) * 100;
        }
    },
    methods: {
        selectCategory(tag, dropdown) {
            dropdown.close();
            this.tag = tag;
        },
        replaceImage() {
            return this.editor.pickImage(() => {}).then(image => {
                this.elements.forEach(element => {
                    this.editor.replaceImage(image.src, {
                        width: image.width,
                        height: image.height
                    }, element);
                });
            });
        },
        showEditor() {
            this.editor.showElementEditor(this.elem);
        },
        converElement(value, dropdown) {
            const { editor, elements } = this;
            const curType = this.curType;
            const methods = {
                'image-mask': (element) => {
                    element.category = 'mainImg';
                    editor.convertImageToMask(element);
                },
                'mask-image': (element) => {
                    element.category = '';
                    editor.convertMaskToImage(element);
                },
                'image-ninePatch': (element) => {
                    element.category = '';
                    editor.convertElementToNinePatch(element);
                },
                'mask-ninePatch': (element) => {
                    element.category = '';
                    editor.convertElementToNinePatch(element);
                },
                'ninePatch-image': (element) => {
                    element.category = '';
                    editor.convertNinePatchToImage(element);
                },
                'ninePatch-mask': (element) => {
                    element.category = '';
                    editor.convertNinePatchToImage(element).then(newElement => {
                        newElement.category = 'mainImg';
                        editor.convertImageToMask(newElement);
                    });
                }
            };

            elements.forEach(element => {
                const key = `${curType}-${value}`;
                key && methods[key](element);
            });

            dropdown.close();
        },
        flip(dir) {
            this.elements.forEach(element => {
                this.editor.flipElement(dir, element);
            });
        }
    }
};
</script>
