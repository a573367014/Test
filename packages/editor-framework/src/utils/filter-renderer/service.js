import Promise from 'bluebird';

// 滤镜配置
const filters = [
    // 对比度
    'https://st0.dancf.com/csc/208/configs/system/20210303-131232-121b.zip',
    // 色相/饱和度/亮度
    'https://st0.dancf.com/csc/208/configs/system/20210303-131314-e20b.zip',
    // 清晰度
    'https://st0.dancf.com/csc/208/configs/system/20210303-131302-edf5.zip',
    // 高斯模糊
    'https://st0.dancf.com/csc/208/configs/system/20210303-131325-c7a3.zip',
    // 色调 / 色温
    'https://st0.dancf.com/csc/208/configs/system/20210303-131335-82a7.zip',
];

const filterParamsMap = {
    contrast: [
        {
            key: 'contrast',
            index: '0',
            params: ['uniContrast'],
            format: function (value) {
                return Math.floor(value) / 100;
            },
        },
    ],
    sharpness: [
        {
            key: 'clarityFast',
            index: '3',
            params: ['alpha'],
            format: function (value) {
                return Math.floor(value) / 100;
            },
        },
    ],
    gaussianBlur: [
        {
            key: 'gaussian-ex',
            index: '0',
            params: ['sigma'],
            format: function (value) {
                return Math.floor(value * 5);
            },
        },
        {
            key: 'gaussian-ex',
            index: '1',
            params: ['sigma'],
            format: function (value) {
                return Math.floor(value * 5);
            },
        },
    ],
    hueRotate: [
        {
            key: 'hslAdjust',
            index: '0',
            params: ['hue'],
            format: function (value) {
                return Math.floor(value);
            },
        },
    ],
    saturate: [
        {
            key: 'hslAdjust',
            index: '0',
            params: ['saturation'],
            format: function (value) {
                return Math.floor(value) / 100;
            },
        },
    ],
    brightness: [
        {
            key: 'hslAdjust',
            index: '0',
            params: ['Lightness'],
            format: function (value) {
                return Math.floor(value) / 100; // 亮度限制在 +- 0.6 区间
            },
        },
    ],
    temperature: [
        {
            key: 'whiteBalance',
            index: '0',
            params: ['temperature'],
            format: function (value) {
                return Math.floor(value) / 100;
            },
        },
    ],
    tint: [
        {
            key: 'whiteBalance',
            index: '0',
            params: ['tint'],
            format: function (value) {
                return Math.floor(value) / 100;
            },
        },
    ],
};

class FilterRendererService {
    constructor() {
        this.renderPromise = null;
        this.baseFilters = [];
        this.baseFiltersPromise = null;
        this.contrast = null;
        this.sharpness = null;
        this.gaussianBlur = null;
        this.hueRotate = null;
        this.saturate = null;
        this.brightness = null;
        this.imageData = null;

        window._illusionService = this;
    }

    /**
     * 创建图层
     */
    async createFilterLayer(img) {
        const render = await this.getRender();
        await render.setSourceImage(img);
        await render.resetFiltes();
    }

    getRender() {
        if (!this.renderPromise) {
            this.renderPromise = import(
                /* webpackChunkName: "filter-renderer" */ '@gaoding/editor-illusion'
            )
                .then((module) => {
                    return new module.EditorIllusion({
                        encryptMode: true,
                        preloads: [],
                        useWorker: true,
                    });
                })
                .then((render) => {
                    return render.checkReady().then(() => render);
                });
        }
        return this.renderPromise;
    }

    // 加载基础滤镜
    loadBaseFilters() {
        const zipUrls = Object.values(filters);
        if (!this.baseFiltersPromise) {
            this.baseFiltersPromise = this.getRender().then((render) => {
                return Promise.map(zipUrls, (zipUrl) => {
                    return render.loadFilters(zipUrl);
                })
                    .then((filterLists) => {
                        filterLists.forEach((filters) => {
                            filters.forEach((filter) => {
                                this.baseFilters.push(filter);
                            });
                        });
                        this._initFilterParams(this.baseFilters);
                    })
                    .then(() => {
                        return this.baseFilters;
                    });
            });
        }
        return this.baseFiltersPromise;
    }

    /**
     * 初始化基础滤镜参数配置
     * @param { import('@gaoding/illusion-sdk/lib/model/filter').Filter[] } filters
     */
    _initFilterParams(filters) {
        const keys = Object.keys(filterParamsMap);
        keys.forEach((key) => {
            const paramsMaps = filterParamsMap[key];
            const paramsCache = [];
            paramsMaps.forEach((paramsMap) => {
                filters.forEach((filter) => {
                    if (filter.name === paramsMap.key && filter.index === paramsMap.index) {
                        paramsMap.params.forEach((param) => {
                            if (filter.params[param]) {
                                paramsCache.push({
                                    filter: filter,
                                    param: param,
                                    format: paramsMap.format,
                                });
                            }
                        });
                        this[key] = paramsCache;
                    }
                });
            });
        });
    }

    // 更新基础滤镜参数
    updateFilterParam(key, value) {
        const paramsCache = this[key];
        if (!paramsCache) {
            console.warn(`param key(${key}) not exist!`);
            return Promise.resolve();
        }
        return Promise.map(paramsCache, (paramCache) => {
            const { filter, param, format } = paramCache;
            const newValue = format(value);
            return filter.updateParamValue(param, newValue);
        });
    }
}

export const filterRendererService = new FilterRendererService();
