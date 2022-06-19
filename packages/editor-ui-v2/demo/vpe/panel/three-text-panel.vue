
<style lang="less">
    .three-text-panel {
        font-size: 10px;
        .eui-v2-effect-slider{
            height: 40px;
            display: flex;
            align-content: center;
            align-items: center;
            .desc{
                width:55px;
                height:20px;
                font-size:14px;
                font-family:PingFangSC-Regular;
                font-weight:400;
                color:rgba(0,0,0,1);
                line-height:20px;
            }
            .num{
                width:24px;
                height:17px;
                font-size:13px;
                font-family:Helvetica;
                color:rgba(0,0,0,1);
                line-height:16px;
            }
        }
    }
</style>

<template>
    <div class="three-text-panel" v-if="element">
        <!-- <ThreeTextStyle :element="element"/> -->
        <eui-v2-panel padding>
            <eui-v2-sub-panel>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">厚度</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="100"
                            :min="0"
                            :value="extrudeDepth"
                            :bubble="true"
                            :type="'percent'"
                            @change="setExtrudeDepth"
                        />
                    </div>
                    <span class="num">{{Math.round(extrudeDepth)}}</span>
                </div>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">倒角</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="40"
                            :min="0"
                            :value="bevelSize"
                            :bubble="true"
                            :type="'percent'"
                            @change="setBevelSize"
                        />
                    </div>
                    <span class="num">{{Math.round(bevelSize)}}</span>
                </div>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">粗细</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="5"
                            :min="0"
                            :value="scale"
                            :bubble="true"
                            :type="'percent'"
                            @change="setScale"
                        />
                    </div>
                    <span class="num">{{Math.round(scale)}}</span>
                </div>
            </eui-v2-sub-panel>
        </eui-v2-panel>
        <ThreePopFontFamily :element="element" :font-list="options.fontList" :platform-id="32" :font-loaded="fontLoaded"/>
        <ThreePopFontSize v-model="element.fontSize" :font-size-list="options.fontSizeList" />
        <eui-v2-panel padding>
            <div class="eui-v2-effect-slider" >
                <span class="desc">不透明</span>
                <div style="width: 105px">
                    <RangeSlider
                        :max="100"
                        :min="0"
                        :value="opacity"
                        :bubble="true"
                        :type="'percent'"
                        @change="setOpacity($event / 100)"
                    />
                </div>
                <span class="num">{{Math.round(opacity)}}</span>
            </div>
        </eui-v2-panel>
        <eui-v2-panel padding>
            <eui-v2-sub-panel>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">纹理角度</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="360"
                            :min="0"
                            :value="texRotateAngle"
                            :bubble="true"
                            :type="'percent'"
                            @change="setTexAngle"
                        />
                    </div>
                    <span class="num">{{Math.round(texRotateAngle)}}</span>
                </div>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">纹理偏移X</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="1"
                            :min="0"
                            :value="texTranslateX"
                            :bubble="true"
                            :type="'percent'"
                            @change="setTexTranslateX"
                        />
                    </div>
                    <span class="num">{{texTranslateX}}</span>
                </div>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">纹理偏移Y</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="1"
                            :min="0"
                            :value="texTranslateY"
                            :bubble="true"
                            :type="'percent'"
                            @change="setTexTranslateY"
                        />
                    </div>
                    <span class="num">{{texTranslateY}}</span>
                </div>
                <div class="eui-v2-effect-slider" >
                    <span class="desc">纹理缩放</span>
                    <div style="width: 105px">
                        <RangeSlider
                            :max="5"
                            :min="0"
                            :value="texScale"
                            :bubble="true"
                            @change="setTexScale"
                        />
                    </div>
                    <span class="num">{{Math.round(texScale)}}</span>
                </div>
            </eui-v2-sub-panel>
        </eui-v2-panel>
        <TextControl :editor="editor" />
    </div>
   

</template>

<script>
import fontList from '../font-list';
import { RangeSlider, ThreePopFontFamily, ThreePopFontSize, ThreeTextControl,TextControl } from '../../../src';
import Panel from '@/src/base/panel';

export default {
    props: {
        element: {
            type: Object,
            required: true
        },
        editor: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            options: {
                fontList,
                fontSizeList: [6, 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 84, 96, 108, 120],
            },
        };
    },
    computed: {
        rotate3d() {
            return this.element.rotate3d;
        },
        rotateType() {
            return this.element.rotateType;
        },
        elemType() {
            return this.element && this.element.type;
        },
        pointLights() {
            return this.element.pointLights;
        },
        fontLoaded() {
            return this.elemType.$fontLoaded;
        },
        extrudeDepth() {
            return this.element.layers[0].extrudeDepth;
        },
        bevelSize() {
            return this.element.layers[0].bevelSize;
        },
        scale() {
            return this.element.layers[0].expand;
        },
        opacity() {
            if(this.isSelector) {
                const maxOpacity = Math.max.apply(Math, this.element.elements.map(e => e.opacity));
                return maxOpacity * 100;
            }
            return this.element.opacity * 100;
        },
        texTranslateX(){
            const value = this.element.layers[0].frontMaterials.albedo.texTranslate[0]
            return value;
        },
        texTranslateY(){
            return this.element.layers[0].frontMaterials.albedo.texTranslate[1];
        },
        texRotateAngle(){
            return this.element.layers[0].frontMaterials.albedo.texRotateAngle;
        },
        texScale(){
            return this.element.layers[0].frontMaterials.scale;
        }

    },
    components: {
        ThreePopFontFamily,
        ThreePopFontSize,
        ThreeTextControl,
        TextControl,
        RangeSlider,
        'eui-v2-panel': Panel
    },
    methods: {
        resetCrop() {
            const { editor } = this;
            if(this.isCrop) {
                editor.$events.$emit('element.applyEdit', editor.currentElement);
            }
        },
        setExtrudeDepth(value) {
            this.element.layers[0].extrudeDepth = value;
        },
        setBevelSize(value) {
            this.element.layers[0].bevelSize = value;
        },
        setScale(value) {
            this.element.layers[0].expand = value;
        },
        setOpacity(value) {
            this.element.opacity = value;
        },
        setTexAngle(value){
            const layer= this.element.layers[0];
            [layer.frontMaterials.albedo,layer.sideMaterials.albedo,layer.bevelMaterials.albedo].forEach((albedo)=>{
                albedo.texRotateAngle = value;
            })
            this.element.layers[0].frontMaterials.albedo.texRotateAngle = value;
        },
        setTexTranslateX(value){
            const layer= this.element.layers[0];
            [layer.frontMaterials.albedo,layer.sideMaterials.albedo,layer.bevelMaterials.albedo].forEach((albedo)=>{
                albedo.texTranslate.splice(0,1,value);
            })
        },
        setTexTranslateY(value){
            const layer= this.element.layers[0];
            [layer.frontMaterials.albedo,layer.sideMaterials.albedo,layer.bevelMaterials.albedo].forEach((albedo)=>{
                albedo.texTranslate.splice(1,1,value);
            })
        },
        setTexScale(value){
            this.element.layers[0].frontMaterials.scale = value;
            this.element.layers[0].sideMaterials.scale = value;
            this.element.layers[0].bevelMaterials.scale = value;
        }
    }
};
</script>
