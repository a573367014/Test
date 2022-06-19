<template>
    <ul>
        <li @click="removeFilter">清除滤镜</li>
        <li
            v-for="(filter, index) in filters"
            :key="filter.name"
            class="eui-v2-image-button" @click="changeFilter(filter)">
            {{filter.name}}
        </li>
        <li>
            <RangeSlider
                :max="1"
                :min="0"
                :value="currentStrong"
                @change="changeStrong"
                />
        </li>
    </ul>
</template>

<script>
import { RangeSlider } from '@/src';
import { getFilterIntensity, setFilterIntensity } from '@gaoding/editor-utils/adaptor/filter-info';

export  default {
    props: {
        editor: {
            type: Object,
            required: true,
        }
    },
    components: {
        RangeSlider,
    },
    data() {
        return {
            currentStrong: 1,
            filters: [{
                name: '滤镜1',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190930-134041-5bbc.unknow",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190930-134041-55b7.unknow",
                    "strong": 0.8
                },
            }, {
                name: '滤镜2',
                filterInfo: {
                    zipUrl:"https://st-gdx.dancf.com/gaodingx/73/illusion/20190812-143109-86be.zip",
                    prunedZipUrl:"https://st-gdx.dancf.com/gaodingx/73/illusion/20190812-143109-86be.zip",
                    strong:0.8
                }
            }, {
                name: '滤镜3',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190814-175931-3b3e.zip",
                    "strong": 0.8,
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190814-175931-3b3e.zip"
                }
            }, {
                name: '滤镜4',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190826-141546-cdf1.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190826-141546-97c2.zip",
                    "strong": 0.8
                }
            }, {
                name: '滤镜5',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/211/illusion/20190815-165046-3fdf.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/211/illusion/20190815-165046-3fdf.zip",
                    "strong": 0.8
                }
            }, {
                name: '一个滤镜',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190827-142700-359d.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190827-142700-2bc3.zip",
                    "strong": 0.8
                }
            }, {
                name: '高光',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190828-103917-6e3a.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/215/illusion/20190828-103917-e65b.zip",
                    "strong": 0.8
                }
            }, {
                name: '滤镜Qrx1',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190828-110710-cee1.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190828-110710-cb61.zip",
                    "strong": 0.8
                }
            }, {
                name: '滤镜链',
                filterInfo: {
                    zipUrl:"https://st-gdx.dancf.com/gaodingx/215/illusion/20190902-145323-d1c5.zip",
                    prunedZipUrl:"https://st-gdx.dancf.com/gaodingx/215/illusion/20190902-145318-1607.zip",
                    strong:0.8
                }
            }, {
                name: '复古',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190909-173320-c0b3.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190909-173320-aa95.zip",
                    "strong": 0.8
                }
            }, {
                name: '唯美',
                filterInfo: {
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190909-150327-19b6.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190909-150327-65e7.zip",
                    "strong": 0.8
                }
            }, {
                name: '通透',
                filterInfo: {
                    "id": 47080,
                    "zipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190911-103752-33ba.zip",
                    "prunedZipUrl": "https://st-gdx.dancf.com/gaodingx/73/illusion/20190911-103752-d90a.zip",
                    "strong": 0.8
                }
            }]
        }
    },
    mounted() {
        if (this.editor.currentElement && this.editor.currentElement.filterInfo) {
            this.currentStrong = getFilterIntensity(this.editor.currentElement.filterInfo);
        }
    },
    methods: {
        changeFilter(filter) {
            this.editor.changeElement({
                filterInfo: filter.filterInfo,
            });
            this.currentStrong = getFilterIntensity(filter.filterInfo);
        },
        changeStrong(val) {
            console.log(val);
            this.currentStrong = val;
            const filterInfo = { ...this.editor.currentElement.filterInfo };
            setFilterIntensity(val, filterInfo);
            this.editor.changeElement({
                filterInfo,
            });
        },
        removeFilter() {
            this.editor.changeElement({
                filterInfo: {
                    zipUrl: '',
                    prunedZipUrl: '',
                    strong: 0.8,
                    intensity: 0.8,
                }
            });
        }
    },
    watch: {
        'editor.currentElement.filterInfo'(filterInfo) {
            this.currentStrong = getFilterIntensity(filterInfo);
        }
    }
}
</script>
