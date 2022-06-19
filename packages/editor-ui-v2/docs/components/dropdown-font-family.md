# dropdown-font-family 字体下拉框

用于选择字体的下拉框组件

## 控件引入

```js
import { DropdownFontFamily } from '@gaoding/editor-ui/src';
```

## 示例

:::demo
<style lang="less">
    .demo-dropdown-font-family {
        width: 210px;
    }
</style>

<template>
    <div class="demo-dropdown-font-family">
        <eui-v2-dropdown-font-family
            block
            :font="currentFont"
            :fonts-list="fontsList"
            :lang.sync="lang"
            :height="300"
            :placeholder-height="376"
            />
    </div>

</template>

<script>

function isLimitFreeFont(font) {
    return (+font.limit_free === 1 && +font.limit_expired === 0) || font.sale_type === 1;
}

function isBusinessFont(font, platformId) {
    const { commercial, commercial_platforms: commercialPlatforms } = font;

    if(commercial === 1) {
        return commercialPlatforms === 0 || commercialPlatforms === undefined ? true : !!(platformId & commercialPlatforms);
    }

    return false;
}

export default {
    data() {
        const commercialImage = '/pages/gaoding/editor/docs/editor-ui/images/commercial.png';
        return {
            platformId: 1023,
            fontList: [],
            lang: 'zh',
            maxHeight: 0,
            currentFont: {
                'id': 332,
                'deleted': 0,
                'name': 'HYXiaoBoMeiYanTiJ',
                'alias': '汉仪晓波美妍体简',
                'family': 'HYXiaoBoMeiYanTiJ',
                'style': 'normal',
                'weight': 400,
                'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135202-7.ttf',
                'woff': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135202-8.woff',
                'ttf_size': 2466172,
                'woff_size': 1535024,
                'preview': {
                    'url': 'https://st0.dancf.com/csc/12/fonts/332/20190128-151312-0f73.svg',
                    'width': 510,
                    'height': 80
                },
                'platforms': 7650,
                'commercial_platforms': 2047,
                'clients': 7,
                'commercial': 1,
                'price': 0,
                'status': 1,
                'priority': 97,
                'created_at': 1528437130,
                'updated_at': 1553580198,
                'lang': 'zh',
                'sale_type': 0,
                'limit_free': 0,
                'purchase_link': '',
                'limit_expired_at': 2524579200,
                'origin_file': '',
                'limit_expired': 0,
                'tooltip': '测试',
            },
            currentFonts: [{
                'id': 332,
                'deleted': 0,
                'name': 'HYXiaoBoMeiYanTiJ',
                'alias': '汉仪晓波美妍体简',
                'family': 'HYXiaoBoMeiYanTiJ',
                'style': 'normal',
                'weight': 400,
                'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135202-7.ttf',
                'woff': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135202-8.woff',
                'ttf_size': 2466172,
                'woff_size': 1535024,
                'preview': {
                    'url': 'https://st0.dancf.com/csc/12/fonts/332/20190128-151312-0f73.svg',
                    'width': 510,
                    'height': 80
                },
                'platforms': 7650,
                'commercial_platforms': 2047,
                'clients': 7,
                'commercial': 1,
                'price': 0,
                'status': 1,
                'priority': 97,
                'created_at': 1528437130,
                'updated_at': 1553580198,
                'lang': 'zh',
                'sale_type': 0,
                'limit_free': 0,
                'purchase_link': '',
                'limit_expired_at': 2524579200,
                'origin_file': '',
                'limit_expired': 0,
                'tooltipPreview': {
                    url: 'https://st0.dancf.com/csc/12/fonts/332/20190128-151312-0f73.svg'
                },
                disabled: true,
                'tipIcon': commercialImage
            }, {
                'id': 331,
                'deleted': 0,
                'name': 'HYRunYuan-FEW',
                'alias': '汉仪润圆-65W',
                'family': 'HYRunYuan-65W',
                'style': 'normal',
                'weight': 600,
                'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135045-4.ttf',
                'woff': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135045-5.woff',
                'ttf_size': 3374068,
                'woff_size': 1906164,
                'preview': {
                    'url': 'https://st0.dancf.com/csc/12/fonts/331/20190128-151422-1372.svg',
                    'width': 300,
                    'height': 80
                },
                'platforms': 7650,
                'commercial_platforms': 2047,
                'clients': 7,
                'commercial': 1,
                'price': 0,
                'status': 1,
                'priority': 97,
                'created_at': 1528437073,
                'updated_at': 1553572966,
                'lang': 'zh',
                'sale_type': 0,
                'limit_free': 0,
                'purchase_link': '',
                'limit_expired_at': 2524579200,
                'origin_file': '',
                'limit_expired': 0,
                'tooltip': '不支持此特效',
                'tooltipClass': 'warning'
            }, {
                'id': 330,
                'deleted': 0,
                'name': 'HYJinKaiJ',
                'alias': '汉仪劲楷简',
                'family': 'HYJinKaiJ',
                'style': 'normal',
                'weight': 400,
                'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20180508-134936-1.ttf',
                'woff': 'https://st0.dancf.com/csc/3/fonts/0/20180508-134936-2.woff',
                'ttf_size': 3246188,
                'woff_size': 2103840,
                'preview': {
                    'url': 'https://st0.dancf.com/csc/12/fonts/330/20190128-151535-adc3.svg',
                    'width': 324,
                    'height': 80
                },
                'platforms': 7650,
                'commercial_platforms': 2047,
                'clients': 7,
                'commercial': 1,
                'price': 0,
                'status': 1,
                'priority': 97,
                'created_at': 1528437000,
                'updated_at': 1553580211,
                'lang': 'zh',
                'sale_type': 0,
                'limit_free': 0,
                'purchase_link': '',
                'limit_expired_at': 2524579200,
                'origin_file': '',
                'limit_expired': 0
            }]
        }
    },
    computed: {
        fontsList: function() {
            const { lang } = this;
            return this.getFontsByLang(lang);
        }
    },
    created() {
        const req = new XMLHttpRequest();
        req.open('GET', '/resources/font-list.json', true);
        req.responseType = 'json';
        req.onload = () => {
            this.fontList = req.response;
        };
        req.send(null);
    },
    methods: {
        getFontsByLang(lang) {
            const { fontList, currentFonts, platformId } = this;

            const fontMap = {
                currentFonts: [],
                freeFonts: [],
                limitFreeFonts: [],
                businessFonts: []
            };


            currentFonts.forEach(font => {
                if(font.lang !== lang) {
                    return;
                }

                fontMap.currentFonts.push(font);
            });

            fontList.forEach(font => {
                if(font.lang !== lang) {
                    return;
                }

                if(isBusinessFont(font, platformId)) {
                    if(isLimitFreeFont(font)) {
                        fontMap.limitFreeFonts.push(font);
                    }
                    else {
                        fontMap.businessFonts.push(font);
                    }
                }
                else {
                    fontMap.freeFonts.push(font);
                }
            });

            return [{
                title: '当前模板字体',
                fonts: fontMap.currentFonts,
            }, {
                title: '免费字体 (可商用)',
                fonts: fontMap.freeFonts
            }, {
                title: '商业字体（限时免费商用）',
                fonts: fontMap.limitFreeFonts,
                tip: '企业版会员上线前，可免费商用并获得作品内的永久授权。',
            }, {
                title: '商业字体 (需购买授权)',
                fonts: fontMap.businessFonts,
                tip: '若需商业使用，需自行向字体公司购买版权。',
                tipUrl: 'http://www.gaoding.com/help/360'
            }];
        }
    }
}
</script>

:::

## API

### props

名称 | 说明 | 类型 | 必填 | 默认值 |
|--|--|--|--|--|
|font | 当前字体 | FontObject | false | null |
|fontsList | 字体列表 | FontsList | false | [] |
|lang | 选择的语言 | String | false | 'zh' |
|tooltipPlacement | 鼠标悬浮在字体上弹出的气泡位置 | String | false | 'left-center' |
|height| 弹出框高度 | Number | false | 300|
|forcePlacement | 鼠标悬浮在字体上弹出的气泡位置是否固定位置 | Boolean | false | false |
|loading | 是否显示加载动画 | Boolean | false | false |
| block |  下拉按钮是否宽度撑满 | Boolean | false | false |


### events

