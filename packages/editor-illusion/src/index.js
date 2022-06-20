import { LRUMap } from 'lru_map';
import { installIllusionEngine } from '@gaoding/illusion-sdk';
import { EngineStatus } from '@gaoding/illusion-sdk/lib/enums/engine-status';
import { MixerType } from '@gaoding/illusion-sdk/lib/enums/mixer-type';

const DEFAULT_CANVAS_SIZE = 500;

/**
 * @typedef IllusionConfig
 * @property { import('@gaoding/illusion-sdk/lib/model/filter').Filter[] } filters
 * @property { import('@gaoding/illusion-sdk/lib/model/layer').Layer[] } layers
 * @property { import('@gaoding/illusion-sdk/lib/model/mixer').Mixer | null } mixer
 */

let idKey = 0;

export class EditorIllusion {
    /**
     * 构造器
     * @param { import('@gaoding/illusion-sdk/lib/options').Options | undefined } options
     */
    constructor(options, maxCache = 10) {
        this.$id = `illusion_${idKey}`;
        idKey += 1;
        this.cacheCanvas = document.createElement('canvas');
        /**
         * @type { Map<string, Promise<IllusionConfig>> }
         */
        this.materialMap = new Map();
        /**
         * @type { import('@gaoding/illusion-sdk/lib/model/frame-buffer').FrameBuffer | null }
         */
        this.frameBuffer = null;
        this.cacheMap = new LRUMap(maxCache);
        this.$ready = installIllusionEngine(options).then(async (engine) => {
            this.engine = engine;
            await engine.init();
            await this.$initEngineCanvas();
            await this.$initLayer();
        });
        window._test = this;
    }

    /**
     * (私有)初始化引擎画布
     */
    async $initEngineCanvas() {
        const { engine, offscreenMode } = this;
        if (offscreenMode) {
            const canvas = new OffscreenCanvas(DEFAULT_CANVAS_SIZE, DEFAULT_CANVAS_SIZE);
            await engine.registerOffscreenCanvas(this.$id, canvas);
            this.canvas = canvas;
        } else {
            const canvas = document.createElement('canvas');
            canvas.id = this.$id;
            canvas.width = DEFAULT_CANVAS_SIZE;
            canvas.height = DEFAULT_CANVAS_SIZE;
            canvas.style.position = 'absolute';
            canvas.style.left = '-9999px';
            canvas.style.opacity = 0;
            canvas.style.pointerEvents = 'none';
            document.body.append(canvas);
            this.canvas = canvas;
        }
        const target = await engine.createTarget(
            `#${this.$id}`,
            DEFAULT_CANVAS_SIZE,
            DEFAULT_CANVAS_SIZE,
        );
        await target.setOffscreen(offscreenMode, offscreenMode);
        this.target = target;
        await engine.prepare(target);
        await engine.setBackgroundColor(0, 0, 0, 0);
    }

    /**
     * (私有)构造图层
     */
    async $initLayer() {
        const { engine } = this;
        const layer = await engine.createLayer();
        await engine.addLayer(layer);
        this.layer = layer;
    }

    /**
     * (私有)清空 framebuffer
     */
    async $clearSource() {
        const { frameBuffer, layer } = this;
        if (frameBuffer) {
            await frameBuffer.destory();
            this.frameBuffer = null;
        }
        if (layer.source) {
            await layer.source.destory();
        }
    }

    /**
     * 是否使用 offscreenCanvas 渲染
     */
    get offscreenMode() {
        return this.engine.options.useWorker;
    }

    /**
     * 检查滤镜引擎是否加载完成
     * @returns { Promise<any> }
     */
    checkReady() {
        return this.$ready;
    }

    /**
     * 修改画布大小
     * @param { number } width
     * @param { number } height
     */
    async resize(width, height) {
        const { engine, target } = this;
        if (target.width === width && target.height === height) {
            return;
        }
        if (engine.status === EngineStatus.Running) {
            await engine.stop(false);
        }

        await target.setSize(width, height);
        await engine.prepare(target);
    }

    /**
     * 加载基础滤镜包
     * @param { string } zipUrl - ZIP 包地址
     * @returns { Promise<import('@gaoding/illusion-sdk/lib/model/filter').Filter[]>}
     */
    loadFilters(zipUrl) {
        return fetch(zipUrl)
            .then((response) => response.arrayBuffer())
            .then((buffer) => this.engine.createFiltersByZip(buffer))
            .then((config) => config.filters);
    }

    /**
     * 加载滤镜素材包
     * @param { string } zipUrl - ZIP 包地址
     */
    loadMaterial(zipUrl) {
        if (!this.materialMap.has(zipUrl)) {
            const promise = fetch(zipUrl)
                .then((response) => response.arrayBuffer())
                .then((buffer) => this.engine.importZip(buffer))
                .then(async (config) => {
                    const baseLayer = config.layers[0];
                    const filters = baseLayer.filters;
                    const mixer = baseLayer.mixer;
                    if (baseLayer.source) {
                        await baseLayer.source.destory();
                    }
                    await baseLayer.destory();

                    return {
                        filters: filters,
                        mixer: mixer,
                        layers: config.layers.filter((_, i) => i > 0),
                    };
                });
            this.materialMap.set(zipUrl, promise);
        }
        return this.materialMap.get(zipUrl);
    }

    /**
     * 设置渲染源图片
     * @param { HTMLImageElement | HTMLCanvasElement } image
     */
    async setSourceImage(image) {
        await this.resize(image.width, image.height);
        await this.$clearSource();
        const frameBuffer = await this.engine.createFrameBuffer(image.width, image.height);
        if (this.offscreenMode) {
            const offscreenCanvas = new OffscreenCanvas(image.width, image.height);
            const context = offscreenCanvas.getContext('2d');
            context.drawImage(image, 0, 0);
            await frameBuffer.setTexture(offscreenCanvas.transferToImageBitmap());
        } else {
            await frameBuffer.setTexture(image);
        }
        const source = await this.engine.createSource();
        await this.layer.setSource(source);
        await this.layer.source.setFrameBuffer(frameBuffer);
        this.frameBuffer = frameBuffer;
    }

    /**
     * 重置滤镜效果
     */
    async resetFiltes() {
        const { engine, layer } = this;
        await Promise.all(
            engine.layers
                .filter((_layer) => _layer !== layer)
                .map((layer) => engine.removeLayer(layer)),
        );
        await Promise.all(
            layer.filters.map((filter) => filter).map((filter) => layer.removeEffect(filter)),
        );
        await layer.setMixerType(MixerType.NORMAL);
    }

    /**
     * 添加滤镜效果
     * @param { import('@gaoding/illusion-sdk/lib/model/filter').Filter[] } filters - 滤镜
     * @param { import('@gaoding/illusion-sdk/lib/model/mixer').Mixer } mixer - 混合模式
     * @param { import('@gaoding/illusion-sdk/lib/model/layer').Layer[] } layers - 叠加图层
     */
    async addEffect(filters, mixer, layers) {
        // 设置滤镜
        if (filters) {
            await filters.reduce((promise, filter) => {
                return promise.then(() => this.layer.addEffect(filter, false));
            }, Promise.resolve());
        }
        // 设置混合模式
        if (mixer) {
            await this.layer.setMixer(mixer);
        } else {
            await this.layer.setMixerType(MixerType.NORMAL);
        }

        // 设置叠加图层
        if (layers) {
            await layers.reduce((promise, layer) => {
                return promise.then(() => this.engine.addLayer(layer));
            }, Promise.resolve());
        }
    }

    /**
     * 渲染滤镜素材
     * @param { HTMLCanvasElement | HTMLImageElement } image
     * @param { string } zipUrl
     * @param { number } strong
     * @param { string } [cacheKey] - 缓存 key，不传则不进行缓存
     */
    async renderMaterial(image, zipUrl, strong, cacheKey) {
        const { cacheMap } = this;
        let promise = cacheKey ? cacheMap.get(cacheKey) : null;
        if (!promise) {
            promise = this.setSourceImage(image)
                .then(() => this.resetFiltes())
                .then(() => this.loadMaterial(zipUrl))
                .then(({ layers, filters, mixer }) => this.addEffect(filters, mixer, layers))
                .then(() => this.render())
                .then((canvas) => {
                    const newCanvas = document.createElement('canvas');
                    newCanvas.width = canvas.width;
                    newCanvas.height = canvas.height;
                    const context = newCanvas.getContext('2d');
                    context.drawImage(canvas, 0, 0);
                    return newCanvas;
                })
                .catch((error) => {
                    if (cacheKey) {
                        cacheMap.delete(cacheKey);
                    }
                    throw error;
                });

            if (cacheKey) {
                cacheMap.set(cacheKey, promise);
            }
        }

        return promise.then((canvas) => this.complexWithStrong(image, canvas, strong));
    }

    /**
     * 渲染滤镜
     */
    async render() {
        const image = await this.engine.submit(0);
        const canvas = this.cacheCanvas;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, image.width, image.height);

        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);

        if (image.close) {
            image.close();
        }
        return canvas;
    }

    /**
     * 强度混合
     * @param { HTMLImageElement | HTMLCanvasElement } sourceImage - 原始图
     * @param { HTMLCanvasElement } resultImage - 结果图
     * @param { number } strong - 混合强度
     */
    complexWithStrong(sourceImage, resultImage, strong) {
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        c.width = sourceImage.width;
        c.height = sourceImage.height;

        ctx.save();
        ctx.globalAlpha = 1 - strong;
        ctx.drawImage(sourceImage, 0, 0);
        ctx.restore();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = strong;
        ctx.drawImage(resultImage, 0, 0);
        ctx.restore();

        return c;
    }

    /**
     * 销毁引擎
     */
    async destory() {
        await this.resetFiltes();

        const configPromises = Array.from(this.materialMap.values());
        await Promise.all(
            configPromises.map(async (configPromise) => {
                const config = await configPromise;
                await Promise.all(config.filters.map((filter) => filter.destory()));
                await Promise.all(
                    config.layers.map((layer) => {
                        layer.mixer && layer.mixer.destory();
                        layer.source && layer.source.destory();
                        return layer.destory();
                    }),
                );
                if (config.mixer) {
                    await config.mixer.destory();
                }
            }),
        );

        this.materialMap.clear();
        if (this.frameBuffer) {
            this.frameBuffer.destory();
            this.frameBuffer = null;
        }
        this.layer = null;

        await this.engine.destory();
        if (!this.offscreenMode) {
            this.canvas.remove();
        }
    }
}
