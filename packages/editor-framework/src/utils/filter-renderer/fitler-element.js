import Promise from 'bluebird';
import isEqual from 'lodash/isEqual';
import loader from '@gaoding/editor-utils/loader';
import { getFilterIntensity } from '@gaoding/editor-utils/adaptor/filter-info';
import { filterRendererService } from './service';
import { compatibleOldVersion } from '@gaoding/editor-illusion/src/utils/compatible-old-version';

export default {
    data() {
        return {
            lastCacheCanvas: null,
            lastFilterInfo: null,
        };
    },
    computed: {
        hasBaseFilters() {
            const { filter, defaultFilter } = this;
            if (!filter) return false;
            return Object.keys(filter).some(
                (key) => typeof filter[key] !== 'undefined' && filter[key] !== defaultFilter[key],
            );
        },
        hasComplexFilters() {
            const { filterInfo } = this;
            return filterInfo && (filterInfo.url || filterInfo.prunedZipUrl);
        },
        hasFilters() {
            return this.hasBaseFilters || this.hasComplexFilters;
        },
        defaultFilter() {
            throw new Error('must set defaultFilter');
        },
        filter() {
            throw new Error('must set filter');
        },
        filterInfo() {
            throw new Error('must set filterInfo');
        },
        filterImage() {
            throw new Error('must set filterImage');
        },
    },
    watch: {
        'filterImage.url'() {
            this.lastFilterInfo = null;
        },
    },

    methods: {
        applyBaseFilters(image) {
            return Promise.all([
                filterRendererService.getRender(),
                filterRendererService.loadBaseFilters(),
            ]).then(async ([render]) => {
                return render.engine.synchronize(async () => {
                    try {
                        const { filterImage, filter } = this;
                        if (!image) {
                            image = await loader.loadImage(filterImage.url);
                        }
                        // 创建图层
                        await filterRendererService.createFilterLayer(image);
                        await render.addEffect(filterRendererService.baseFilters);
                        // 更新滤镜参数
                        const keys = Object.keys(filter);
                        await Promise.map(keys, (key) => {
                            const value = filter[key];
                            return filterRendererService.updateFilterParam(key, value);
                        });
                        const canvas = await render.render();
                        return canvas;
                    } catch (e) {
                        throw e;
                    }
                }).promise;
            });
        },
        applyComplexFilters() {
            return Promise.resolve()
                .then(() => filterRendererService.getRender())
                .then(async (render) => {
                    return render.engine.synchronize(async () => {
                        const { filterInfo, filterImage } = this;
                        const newFilterInfo = compatibleOldVersion(filterInfo.id);
                        if (newFilterInfo) {
                            filterInfo.url = newFilterInfo.url;
                            filterInfo.id = newFilterInfo.id;
                            delete filterInfo.prunedZipUrl;
                        }

                        const { url } = filterImage;
                        const { url: zipUrl } = filterInfo;
                        const strong = getFilterIntensity(filterInfo);
                        const image = await loader.loadImage(url);
                        try {
                            const cacheKey = `${url.substring(url.length - 40)}_${zipUrl}`;
                            const canvas = await render.renderMaterial(
                                image,
                                zipUrl,
                                strong,
                                cacheKey,
                            );
                            if (
                                url === this.filterImage.url &&
                                this.filterInfo &&
                                zipUrl === this.filterInfo.url
                            ) {
                                return canvas;
                            } else {
                                throw new Error('image or filterInfo changed, render canceled');
                            }
                        } catch (e) {
                            throw e;
                        }
                    }).promise;
                });
        },

        applyFilters() {
            const { hasBaseFilters, hasComplexFilters } = this;
            if (!this.renderingPromise) {
                const { filterInfo } = this;
                if (!isEqual(filterInfo, this.lastFilterInfo)) {
                    this.lastCacheCanvas = null;
                    this.lastFilterInfo = Object.assign({}, filterInfo);
                }

                let promise = Promise.resolve(this.lastCacheCanvas);
                if (hasComplexFilters && !this.lastCacheCanvas) {
                    promise = promise
                        .then(() => this.applyComplexFilters())
                        .then(async (canvas) => {
                            this.lastCacheCanvas = canvas;
                            return canvas;
                        });
                }
                if (hasBaseFilters) {
                    promise = promise.then((canvas) => {
                        return this.applyBaseFilters(canvas);
                    });
                }

                promise.finally(() => {
                    this.renderingPromise = null;
                });
                this.renderingPromise = promise;
                return promise;
            }

            const promise = new Promise((resolve) => {
                this.renderingPromise.finally(() => {
                    resolve(this.applyFilters());
                });
            });
            return promise;
        },

        isBase64(str) {
            return !!str && str.indexOf(';base64') > 0;
        },

        isBlob(str) {
            return !!str && str.indexOf('blob:') >= 0;
        },

        getImageData(canvas) {
            const ctx = canvas.getContext('2d');
            return ctx.getImageData(0, 0, canvas.width, canvas.height);
        },

        clearFilterCache() {
            this.lastCacheCanvas = null;
            this.lastFilterInfo = null;
        },
    },
};
