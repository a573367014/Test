<template>
    <div class="juggle-container">
        <!-- <juggle-item>
            <ge-music-item />
        </juggle-item> -->
        <!-- <juggle-item v-for="item in componentList" :key="item.id">
            <component :is="item.name"></component>
        </juggle-item> -->

        <juggle-item
            :left="positionMap.musicItem.left"
            :top="positionMap.musicItem.top"
            :action="positionMap.musicItem.action"
        >
            <ge-music-item
                :title="'爱在西元前'"
                :status="3"
                :duration="3000"
                :preview="'https://img1.baidu.com/it/u=269890824,2691178002&fm=253&fmt=auto&app=120&f=JPEG?w=507&h=500'"
            />
        </juggle-item>
        <juggle-item
            :left="positionMap.colorPicker.left"
            :top="positionMap.colorPicker.top"
            :action="positionMap.colorPicker.action"
        >
            <ge-color-picker :defaultColor="'#2254F4'" :defaultTabs="[0, 1]" />
        </juggle-item>

        <juggle-item
            :left="positionMap.asideButton.left"
            :top="positionMap.asideButton.top"
            :action="positionMap.asideButton.action"
        >
            <div>
                <ge-aside-button :label="'gdeui'" :activated="true" />
                <ge-aside-button :label="'我的'" />
                <ge-aside-button :label="'你的'" :showMask="true" />
            </div>
        </juggle-item>

        <juggle-item
            :left="positionMap.slider.left"
            :top="positionMap.slider.top"
            :action="positionMap.slider.action"
        >
            <ge-slider :value="0" :step="10" />
        </juggle-item>

        <juggle-item
            :left="positionMap.styleBackground.left"
            :top="positionMap.styleBackground.top"
            :action="positionMap.styleBackground.action"
        >
            <div class="juggle__stylebackground">
                <GeStyleBackground
                    :degree="styleBackgroundDegree"
                    :value="styleBackgroundValue"
                    @change="handleChange"
                    :title="'背景属性'"
                />
            </div>
        </juggle-item>
        <juggle-item
            :left="positionMap.sliderList.left"
            :top="positionMap.sliderList.top"
            :action="positionMap.sliderList.action"
        >
            <div class="juggle-slider-list">
                <test-slider-list />
            </div>
        </juggle-item>
        <juggle-item
            :left="positionMap.asideItem.left"
            :top="positionMap.asideItem.top"
            :action="positionMap.asideItem.action"
        >
            <test-aside-item />
        </juggle-item>

        <juggle-item
            :left="positionMap.geImage1.left"
            :top="positionMap.geImage1.top"
            :action="positionMap.geImage1.action"
        >
            <ge-image
                src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fup.enterdesk.com%2F2021%2Fedpic%2F8b%2F63%2F08%2F8b6308d1a1b6e83ca309cb1818e38a91_1.jpg&refer=http%3A%2F%2Fup.enterdesk.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg"
                lowerRightCornerUrl="https://gd-filems.dancf.com/mcm79j/mcm79j/66658/a14c5602-88d3-4b2e-8439-a08cf8fdaffa259730.png"
            >
                <template slot="popoverContent">蓝天热气球彩色多彩缤纷图片摄影手机壁纸</template>
            </ge-image>
        </juggle-item>
        <juggle-item
            :left="positionMap.geImage2.left"
            :top="positionMap.geImage2.top"
            :action="positionMap.geImage2.action"
        >
            <ge-image
                showCheck
                :checked="checked"
                @checkChange="onCheckedChange"
                src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fup.enterdesk.com%2F2021%2Fedpic_source%2F16%2F8c%2Fd4%2F168cd47d1b63e315ea345f239c789505_17.jpg&refer=http%3A%2F%2Fup.enterdesk.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg"
                lowerRightCornerUrl="https://gd-filems.dancf.com/mcm79j/mcm79j/66658/a14c5602-88d3-4b2e-8439-a08cf8fdaffa259730.png"
            >
                <template slot="popoverContent">蓝天热气球彩色多彩缤纷图片摄影手机壁纸</template>
            </ge-image>
        </juggle-item>
        <juggle-item
            :left="positionMap.categoryTag.left"
            :top="positionMap.categoryTag.top"
            :action="positionMap.categoryTag.action"
        >
            <ge-category-tag :title="'分类选择器'" :options="options" />
        </juggle-item>
        <juggle-item
            :left="positionMap.popoverInput.left"
            :top="positionMap.popoverInput.top"
            :action="positionMap.popoverInput.action"
        >
            <TestPopoverInput />
        </juggle-item>
        <juggle-item
            :left="positionMap.compositionSearch.left"
            :top="positionMap.compositionSearch.top"
            :action="positionMap.compositionSearch.action"
        >
            <TestCompositionSearch />
        </juggle-item>
        <juggle-item
            :left="positionMap.categorySearch.left"
            :top="positionMap.categorySearch.top"
            :action="positionMap.categorySearch.action"
        >
            <TestCategorySearch />
        </juggle-item>
        <juggle-item 
            :left="positionMap.stylePreview.left"
            :top="positionMap.stylePreview.top"
            :action="positionMap.stylePreview.action"
        >
            <GeStylePreview
                :preview="'https://st-gdx.dancf.com/templets/88263/shots/20190329-164301-9Ekzz.png?x-oss-process=image/resize,w_300/interlace,1,image/format,webp'"
                :title="'添加样式'"
            />
        </juggle-item>

        <juggle-item :left="515" :top="963">
            <div class="juggle-load-more-list-wrap">
                <div v-for="item in loadMoreList" :key="item">这是一个item：{{ item }}</div>
                <GeLoadMore :loadMore="loadMore" />
            </div>
        </juggle-item>
    </div>
</template>

<script>
import JuggleItem from './JuggleItem.vue';
import TestSlider from '../../examples/base/slider/index.vue';
import TestSliderList from '../../examples/modules/slider-list/index-2.vue';
import TestAsideItem from '../../examples/modules/aside-item/index.vue';
import TestPopoverInput from '../../examples/modules/popover-input/index.vue';
import TestCompositionSearch from '../../examples/modules/composition-search/index.vue';
import TestCategorySearch from '../../examples/modules/category-search/index.vue';
import {
    GeMusicItem,
    GeColorPicker,
    GeAsideButton,
    GeSlider,
    GeStyleBackground,
    GeImage,
    GeCategoryTag,
    GeStylePreview,
    GeLoadMore,
} from '../../../src';
import '../../../es/components/modules/music-item/style';
import '../../../es/components/modules/color-picker/style';
import '../../../es/components/modules/aside-button/style';
import '../../../es/components/base/slider/style';
import '../../../es/components/modules/style-background/style';
import '../../../es/components/modules/image/style';
import '../../../es/components/modules/style-preview/style';
import '../../../es/components/high-level/load-more/style';

export default {
    components: {
        JuggleItem,
        GeMusicItem,
        GeColorPicker,
        GeAsideButton,
        GeSlider,
        GeStyleBackground,
        GeImage,
        TestSlider,
        TestSliderList,
        TestAsideItem,
        GeCategoryTag,
        TestPopoverInput,
        TestCompositionSearch,
        TestCategorySearch,
        GeStylePreview,
        GeLoadMore,
    },
    data: function () {
        return {
            count: 0,
            componentList: [],
            styleBackgroundValue: [
                { color: '#001122', offset: 0.1 },
                { color: 'rgba(255, 0, 0, 0.4)', offset: 0.8 },
            ],
            checked: false,
            styleBackgroundDegree: 120,
            options: [
                {
                    value: '烤肉',
                    children: [
                        { label: 'KAO烤肉', value: 'KAO' },
                        {
                            title: '韩国烤肉',
                            children: [
                                {
                                    label: '1988炭烤鳗鱼',
                                    value: '1988',
                                },
                                {
                                    label: '辛农园',
                                    value: 'xinnongyuan',
                                },
                            ],
                        },
                    ],
                },
                { label: '火锅', children: [{ label: '八合里', value: 'baheli' }] },
            ],
            loadMoreList: [1, 2, 3, 4, 5],
            positionMap: {
                musicItem: this.getPosition(),
                colorPicker: this.getPosition(),
                asideButton: this.getPosition(),
                slider: this.getPosition(),
                styleBackground: this.getPosition(),
                sliderList: this.getPosition(),
                asideItem: this.getPosition(),
                geImage1: this.getPosition(),
                geImage2: this.getPosition(),
                categoryTag: this.getPosition(),
                popoverInput: this.getPosition(),
                compositionSearch: this.getPosition(),
                categorySearch: this.getPosition(),
                stylePreview: this.getPosition(),
            },
        };
    },
    mounted: function () {
        this.positionMap.musicItem = {
            left: 34,
            top: 400,
            action: true,
        };
        this.positionMap.colorPicker = {
            left: 515,
            top: 5,
            action: true,
        };
        this.positionMap.asideButton = {
            left: 34,
            top: 5,
            action: true,
        };
        this.positionMap.slider = {
            left: 515,
            top: 423,
            action: true,
        };
        this.positionMap.styleBackground = {
            left: 34,
            top: 500,
            action: true,
        };
        this.positionMap.sliderList = {
            left: 515,
            top: 491,
            action: true,
        };
        this.positionMap.asideItem = {
            left: 515,
            top: 725,
            action: true,
        };
        this.positionMap.geImage1 = {
            left: 34,
            top: 237,
            action: true,
        };
        this.positionMap.geImage2 = {
            left: 177,
            top: 237,
            action: true,
        };
        this.positionMap.categoryTag = {
            left: 34,
            top: 600,
            action: true,
        };
        this.positionMap.popoverInput = {
            left: 111,
            top: 5,
            action: true,
        };
        this.positionMap.compositionSearch = {
            left: 111,
            top: 176,
            action: true,
        };
        this.positionMap.categorySearch = {
            left: 111,
            top: 87,
            action: true,
        };
        this.positionMap.stylePreview = {
            left: 268,
            top: 500,
            action: true,
        };
        setTimeout(() => {
            Object.keys(this.positionMap).forEach((key) => {
                this.positionMap[key].action = false;
            });
        }, 1000);
    },
    methods: {
        getPosition() {
            return {
                left: Math.random() * 600,
                top: Math.random() * 600,
                action: false,
            };
        },
        onCheckedChange(e) {
            console.log(e);
            this.checked = e.target.checked;
        },
        addComponent(name) {
            this.componentList.push({
                id: ++this.count,
                name,
            });
        },
        handleChange(value, degree) {
            this.styleBackgroundValue = value;
            this.styleBackgroundDegree = degree;
        },
        async request() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    for (let index = 1; index < 20; index++) {
                        this.loadMoreList.push(this.loadMoreList.length + index);
                    }
                    resolve(1);
                }, 2000);
            });
        },
        async loadMore() {
            await this.request();
        },
    },
};
</script>

<style lang="less">
.juggle-container {
    position: relative;
    height: 1200px;
    // width: 1400px;
}

.juggle__stylebackground {
    .style-preview {
        background: #fff;
    }
}
.juggle-slider-list {
    .slider-list {
        background: #fff;
    }
}
.juggle-load-more-list-wrap {
    width: 300px;
    height: 200px;
    background-color: #fff;
    overflow: scroll;
}
</style>
