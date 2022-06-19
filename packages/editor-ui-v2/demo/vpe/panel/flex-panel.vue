<template>
    <eui-v2-tabs value="flex" float-tab>
        <eui-v2-tab name="flex" :content="tabContent" />
        <div class="flex-panel" slot="panel">
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__label">flexDirection</div>
                <div class="eui-v2-pane-form__item">
                    <eui-v2-dropdown-button block>
                        {{ elem.flexDirection }}
                        <template v-slot:dropdown="dropdown">
                            <eui-v2-dropdown-menus>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexDirection', 'row', dropdown)">row</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexDirection', 'column', dropdown)">column</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexDirection', 'row-reverse', dropdown)">row-reverse</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexDirection', 'column-reverse', dropdown)">column-reverse</eui-v2-dropdown-menu>
                            </eui-v2-dropdown-menus>
                        </template>
                    </eui-v2-dropdown-button>
                </div>
            </div>
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__label">justifyContent</div>
                <div class="eui-v2-pane-form__item">
                    <eui-v2-dropdown-button block>
                        {{ elem.justifyContent }}
                        <template v-slot:dropdown="dropdown">
                            <eui-v2-dropdown-menus>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('justifyContent', 'flex-start', dropdown)">flex-start</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('justifyContent', 'flex-end', dropdown)">flex-end</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('justifyContent', 'center', dropdown)">center</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('justifyContent', 'space-between', dropdown)">space-between</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('justifyContent', 'space-around', dropdown)">space-around</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('justifyContent', 'space-evently', dropdown)">space-evently</eui-v2-dropdown-menu>
                            </eui-v2-dropdown-menus>
                        </template>
                    </eui-v2-dropdown-button>
                </div>
            </div>
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__label">alignItems</div>
                <div class="eui-v2-pane-form__item">
                    <eui-v2-dropdown-button block>
                        {{ elem.alignItems }}
                        <template v-slot:dropdown="dropdown">
                            <eui-v2-dropdown-menus>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignItems', 'flex-start', dropdown)">flex-start</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignItems', 'flex-end', dropdown)">flex-end</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignItems', 'center', dropdown)">center</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignItems', 'stretch', dropdown)">stretch</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignItems', 'baseline', dropdown)">baseline</eui-v2-dropdown-menu>
                            </eui-v2-dropdown-menus>
                        </template>
                    </eui-v2-dropdown-button>
                </div>
            </div>
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__label">alignContent</div>
                <div class="eui-v2-pane-form__item">
                    <eui-v2-dropdown-button block>
                        {{ elem.alignContent }}
                        <template v-slot:dropdown="dropdown">
                            <eui-v2-dropdown-menus>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignContent', 'flex-start', dropdown)">flex-start</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignContent', 'flex-end', dropdown)">flex-end</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignContent', 'center', dropdown)">center</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignContent', 'space-between', dropdown)">space-between</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignContent', 'space-around', dropdown)">space-around</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('alignContent', 'space-evently', dropdown)">space-evently</eui-v2-dropdown-menu>
                            </eui-v2-dropdown-menus>
                        </template>
                    </eui-v2-dropdown-button>
                </div>
            </div>
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__label">flexWrap</div>
                <div class="eui-v2-pane-form__item">
                    <eui-v2-dropdown-button block>
                        {{ elem.flexWrap }}
                        <template v-slot:dropdown="dropdown">
                            <eui-v2-dropdown-menus>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexWrap', 'nowrap', dropdown)">nowrap</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexWrap', 'wrap', dropdown)">wrap</eui-v2-dropdown-menu>
                                <eui-v2-dropdown-menu @click="setFlexAttribute('flexWrap', 'wrap-reverse', dropdown)">wrap-reverse</eui-v2-dropdown-menu>
                            </eui-v2-dropdown-menus>
                        </template>
                    </eui-v2-dropdown-button>
                </div>
            </div>
            <div class="eui-v2-panel-form">
                <div class="eui-v2-panel-form__label">autoAdaptive</div>
                <div class="eui-v2-pane-form__item">
                    <eui-v2-input block :value="elem.autoAdaptive"  @change="setFlexAttribute('autoAdaptive', $event)" type="number" />
                </div>
            </div>
            <template v-if="subElem">
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">alignSelf</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-dropdown-button block>
                            {{ subElem.flex.alignSelf }}
                            <template v-slot:dropdown="dropdown">
                                <eui-v2-dropdown-menus>
                                    <eui-v2-dropdown-menu @click="setElementFlex('alignSelf', 'flex-start', dropdown)">flex-start</eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu @click="setElementFlex('alignSelf', 'flex-end', dropdown)">flex-end</eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu @click="setElementFlex('alignSelf', 'center', dropdown)">center</eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu @click="setElementFlex('alignSelf', 'stretch', dropdown)">stretch</eui-v2-dropdown-menu>
                                    <eui-v2-dropdown-menu @click="setElementFlex('alignSelf', 'baseline', dropdown)">baseline</eui-v2-dropdown-menu>
                                </eui-v2-dropdown-menus>
                            </template>
                        </eui-v2-dropdown-button>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">flexGrow</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.flexGrow" @change="setElementFlex('flexGrow', $event)" type="number"/>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">flexShrink</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.flexShrink"  @change="setElementFlex('flexShrink', $event)" type="number" />
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">flexBasis</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.flexBasis"  @change="setElementFlex('flexBasis', $event)" type="text"/>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">order</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.order"  @change="setElementFlex('order', $event)" type="number"/>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">marginTop</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.margin[0]"  @change="setElementMargin(0, $event)" type="number"/>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">marginLeft</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.margin[3]" @change="setElementMargin(3, $event)" type="number"/>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">marginBottom</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.margin[2]" @change="setElementMargin(2, $event)" type="number"/>
                    </div>
                </div>
                <div class="eui-v2-panel-form">
                    <div class="eui-v2-panel-form__label">marginRight</div>
                    <div class="eui-v2-pane-form__item">
                        <eui-v2-input block :value="subElemFlex.margin[1]" @change="setElementMargin(1, $event)" type="number"/>
                    </div>
                </div>
            </template>
            <div class="eui-v2-panel-form">
                <TextNormalPanel
                    v-if="isText"
                    :editor="editor" />
                <ImageNormalPanel
                    v-else-if="isImage || isNinePatch"
                    :editor="editor" />
                <SvgNormalPanel
                    v-else-if="isSvg"
                    :editor="editor" />
                <EditorElementBar
                    v-else
                    :editor="editor" />
            </div>            
        </div>
    </eui-v2-tabs>
</template>

<script>
import {
    EditorGroupControl, EditorElementBar
} from '@/src';
import TextNormalPanel from './text-normal-panel';
import ImageNormalPanel from './image-normal-panel';
import SvgNormalPanel from './svg-normal-panel';
import cloneDeep from 'lodash/cloneDeep';


export default {
    props: {
        editor: { type: Object, required: true },
        initEffects: { type: Object, require: true }
    },
    components: {
        TextNormalPanel,
        ImageNormalPanel,
        SvgNormalPanel,
        EditorGroupControl,
        EditorElementBar
    },
    computed: {
        elem() {
            return this.editor.currentElement;
        },
        subElem() {
            return this.editor.currentSubElement;
        },
        subElemFlex() {
            return this.subElem && this.subElem.flex;
        },
        tabContent() {
            return 'flex';
        },
        isText() {
            if(this.editor.currentSubElement) {
                return this.checkIsText(this.editor.currentSubElement);
            }
            return false;
        },
        isImage() {
            if(this.editor.currentSubElement) {
                return this.checkIsImage(this.editor.currentSubElement);
            }
            return false;
        },
        isNinePatch() {
            if(this.editor.currentSubElement) {
                return this.checkIsNinePatch(this.editor.currentSubElement);
            }
            return false;
        },
        isSvg() {
            if(this.editor.currentSubElement) {
                return this.checkIsSvg(this.editor.currentSubElement);
            }
            return false;
        }
    },
    methods: {
        checkIsText(element) {
            return ['text', 'threeText', 'styledText'].includes(element.type);
        },
        checkIsImage(element) {
            return ['image', 'mask'].includes(element.type);
        },
        checkIsSvg(element) {
            return element.type === 'svg';
        },
        checkIsNinePatch(element) {
            return element.type === 'ninePatch';
        },
        setFlexAttribute(name, value, dropdown) {
            if(dropdown) {
                dropdown.close();
            }
            this.editor.changeElement({
                [name]: value
            }, this.elem);
        },
        setElementFlex(name, value, dropdown) {
            this.editor.changeElementFlex({
                [name]: value
            }, this.subElem);
            if(dropdown) {
                dropdown.close();
            }
        },
        setElementMargin(index, value) {
            const margin = cloneDeep(this.subElem.flex.margin);
            margin[index] = parseFloat(value);
            this.editor.changeElementFlex({
                margin: margin
            }, this.subElem);
        }
    }
};
</script>

<style lang="less" scoped>
.flex-panel {
    padding: 24px;
}
</style>
