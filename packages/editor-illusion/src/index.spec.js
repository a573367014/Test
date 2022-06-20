import { EditorIllusion } from './index';
import { installIllusionEngine } from '../__mocks__/@gaoding/illusion-sdk/index';
import { EngineStatus } from '@gaoding/illusion-sdk/lib/enums/engine-status';

import { enableFetchMocks } from 'jest-fetch-mock';
import { FilterType } from '@gaoding/illusion-sdk/lib/enums/filter-type';
import { MixerType } from '@gaoding/illusion-sdk/lib/enums/mixer-type';

enableFetchMocks();

describe('EditorIllusion', () => {
    test('构造器', () => {
        const config = {
            enableLog: true,
            useWorker: false,
        };
        const illusion = new EditorIllusion(config);

        expect(illusion.$id).toEqual('illusion_0');
        expect(illusion.materialMap).toBeInstanceOf(Map);
        expect(illusion.cacheCanvas).toBeInstanceOf(HTMLCanvasElement);
        expect(illusion.materialMap.size).toBe(0);
        expect(illusion.frameBuffer).toBeNull();
        expect(illusion.$ready).toBeInstanceOf(Promise);
        expect(installIllusionEngine).toHaveBeenCalledTimes(1);
        expect(installIllusionEngine).toHaveBeenCalledWith(config);
        expect(illusion.cacheMap).toBeDefined();
        expect(illusion.cacheMap.limit).toBe(10);

        // 验证 id 自增
        const newIllusion = new EditorIllusion({}, 15);
        expect(newIllusion.$id).toEqual('illusion_1');
        expect(newIllusion.cacheMap.limit).toBe(15);
    });

    test('正确加载', async () => {
        const config = {
            enableLog: true,
            useWorker: false,
        };
        const illusion = new EditorIllusion(config);
        await illusion.checkReady();

        expect(illusion.engine).toBeDefined();
        expect(illusion.layer).toBeDefined();
        expect(illusion.target).toBeDefined();
        expect(illusion.canvas).toBeDefined();
        expect(illusion.engine.status).toBe(EngineStatus.Running);
    });

    describe('初始化引擎画布', () => {
        test('离屏模式', async () => {
            const illusion = new EditorIllusion({ useWorker: true });
            await illusion.checkReady();
            const engine = illusion.engine;
            expect(illusion.canvas).toEqual(OffscreenCanvas.mock.results[0].value);
            expect(engine.registerOffscreenCanvas).toHaveBeenCalledTimes(1);
            expect(engine.registerOffscreenCanvas).toHaveBeenCalledWith(
                illusion.$id,
                illusion.canvas,
            );
            expect(engine.createTarget).toHaveBeenCalledTimes(1);
            expect(engine.createTarget.mock.calls[0][0]).toEqual(`#${illusion.$id}`);
            expect(illusion.target).toEqual(await engine.createTarget.mock.results[0].value);
            expect(illusion.target.setOffscreen).toHaveBeenCalledTimes(1);
            expect(illusion.target.setOffscreen).toHaveBeenCalledWith(true, true);
            expect(engine.prepare).toHaveBeenCalledTimes(1);
            expect(engine.prepare).toHaveBeenCalledWith(illusion.target);
            expect(engine.setBackgroundColor).toHaveBeenCalledTimes(1);
            expect(engine.setBackgroundColor).toHaveBeenCalledWith(0, 0, 0, 0);
        });

        test('非离屏模式', async () => {
            const illusion = new EditorIllusion({ useWorker: false });
            await illusion.checkReady();
            const engine = illusion.engine;
            expect(illusion.canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(illusion.canvas.id).toEqual(illusion.$id);
            expect(illusion.canvas.style.position).toEqual('absolute');
            expect(illusion.canvas.style.pointerEvents).toEqual('none');
            expect(illusion.canvas.style.left).toEqual('-9999px');

            expect(document.body.contains(illusion.canvas)).toBeTruthy();
            expect(illusion.target.setOffscreen).toHaveBeenCalledTimes(1);
            expect(illusion.target.setOffscreen).toHaveBeenCalledWith(false, false);
            expect(engine.prepare).toHaveBeenCalledTimes(1);
            expect(engine.prepare).toHaveBeenCalledWith(illusion.target);
        });
    });

    test('初始化图层', async () => {
        const illusion = new EditorIllusion({ useWorker: false });
        await illusion.checkReady();

        const engine = illusion.engine;
        expect(engine.createLayer).toHaveBeenCalledTimes(1);
        expect(illusion.layer).toEqual(await engine.createLayer.mock.results[0].value);
        expect(engine.addLayer).toHaveBeenCalledTimes(1);
        expect(engine.addLayer).toHaveBeenCalledWith(illusion.layer);
    });

    test('清空 source', async () => {
        const illusion = new EditorIllusion({ useWorker: false });
        await illusion.checkReady();

        // framebuffer 为空时不报错
        await illusion.$clearSource();

        const source = await illusion.engine.createSource();
        await illusion.layer.setSource(source);

        const frameBuffer = await illusion.engine.createFrameBuffer();
        illusion.frameBuffer = frameBuffer;
        await illusion.$clearSource();
        expect(frameBuffer.destory).toHaveBeenCalledTimes(1);
        expect(illusion.frameBuffer).toBeNull();
        expect(source.destory).toHaveBeenCalledTimes(1);
    });

    describe('实例方法测试', () => {
        /**
         * @type { EditorIllusion }
         */
        let illusion;
        beforeEach(async () => {
            illusion = new EditorIllusion();
            await illusion.checkReady();
            jest.clearAllMocks();
        });

        test('getter', () => {
            expect(illusion.offscreenMode).toEqual(illusion.engine.options.useWorker);
        });

        test('修改画布大小', async () => {
            await illusion.resize(300, 400);
            const engine = illusion.engine;

            expect(engine.stop).toHaveBeenCalledTimes(1);
            expect(engine.stop).toHaveBeenCalledWith(false);
            expect(illusion.target.setSize).toHaveBeenCalledTimes(1);
            expect(illusion.target.setSize).toHaveBeenCalledWith(300, 400);
            expect(engine.prepare).toHaveBeenCalledTimes(1);
            expect(engine.prepare).toHaveBeenCalledWith(illusion.target);
            expect(engine.prepare).toHaveBeenCalledAfter(engine.stop);

            // 重复修改无作用
            await illusion.resize(300, 400);
            expect(illusion.target.setSize).toHaveBeenCalledTimes(1);

            // 引擎关闭后不重复关闭引擎
            await illusion.engine.stop(false);
            jest.clearAllMocks();
            await illusion.resize(300, 300);
            expect(engine.stop).toHaveBeenCalledTimes(0);
        });

        test('加载基础滤镜包', async () => {
            const arrayBuffer = new ArrayBuffer(10);
            fetch.mockResponseOnce(() => {
                return Promise.resolve({ body: arrayBuffer });
            });

            const zipUrl = 'http://www.gaoding.test.com/test.zip';
            const result = await illusion.loadFilters(zipUrl);
            expect(fetch).toHaveBeenCalledWith(zipUrl);
            expect(illusion.engine.createFiltersByZip).toHaveBeenCalledWith(arrayBuffer);
            expect(result).toEqual(
                (await illusion.engine.createFiltersByZip.mock.results[0].value).filters,
            );
        });

        test('加载滤镜素材包', async () => {
            const arrayBuffer = new ArrayBuffer(10);
            fetch.mockResponseOnce(() => {
                return Promise.resolve({ body: arrayBuffer });
            });

            const zipUrl = 'http://www.gaoding.test.com/test.zip';
            const result = await illusion.loadMaterial(zipUrl);
            expect(illusion.materialMap.has(zipUrl)).toBeTruthy();
            const engine = illusion.engine;
            expect(engine.importZip).toHaveBeenCalledWith(arrayBuffer);
            const config = await engine.importZip.mock.results[0].value;
            expect(result.filters).toEqual(config.layers[0].filters);
            expect(result.mixer).toEqual(config.layers[0].mixer);
            expect(result.layers).toEqual(config.layers.filter((_, i) => i > 0));
            expect(config.layers[0].source.destory).toHaveBeenCalledTimes(1);
            expect(config.layers[0].destory).toHaveBeenCalledTimes(1);

            // 重复加载使用缓存
            const newResult = await illusion.loadMaterial(zipUrl);
            expect(newResult).toBe(result);
            expect(fetch).toHaveBeenCalledTimes(1);

            fetch.mockResponseOnce(() => {
                return Promise.resolve({ body: new ArrayBuffer(1) });
            });
            const result1 = await illusion.loadMaterial('http://www.gaoding.test.com/test1.zip');
            expect(result1).toBeDefined();
        });

        describe('设置渲染源图片', () => {
            test('非离屏模式', async () => {
                illusion.engine.options.useWorker = false;
                const image = document.createElement('img');
                image.width = 300;
                image.height = 600;
                const resizeSpy = jest.spyOn(illusion, 'resize');
                const clearSourceSpy = jest.spyOn(illusion, '$clearSource');

                await illusion.setSourceImage(image);

                expect(resizeSpy).toHaveBeenCalledTimes(1);
                expect(resizeSpy).toHaveBeenCalledWith(image.width, image.height);
                expect(clearSourceSpy).toHaveBeenCalledTimes(1);

                const engine = illusion.engine;
                expect(engine.createFrameBuffer).toHaveBeenCalledWith(image.width, image.height);
                expect(illusion.frameBuffer).toEqual(
                    await engine.createFrameBuffer.mock.results[0].value,
                );
                expect(illusion.frameBuffer.setTexture).toHaveBeenCalledTimes(1);
                expect(illusion.frameBuffer.setTexture).toHaveBeenCalledWith(image);
                expect(engine.createSource).toHaveBeenCalledTimes(1);
                expect(illusion.layer.source).toEqual(
                    await engine.createSource.mock.results[0].value,
                );

                expect(illusion.layer.source.setFrameBuffer).toHaveBeenCalledWith(
                    illusion.frameBuffer,
                );
            });

            test('离屏模式', async () => {
                illusion.engine.options.useWorker = true;
                const image = document.createElement('img');
                image.width = 300;
                image.height = 600;

                await illusion.setSourceImage(image);

                const engine = illusion.engine;
                expect(OffscreenCanvas).toHaveBeenCalledWith(image.width, image.height);
                const canvas = OffscreenCanvas.mock.results[0].value;
                const context = canvas.getContext.mock.results[0].value;
                expect(context.drawImage).toHaveBeenCalledWith(image, 0, 0);
                expect(illusion.frameBuffer).toEqual(
                    await engine.createFrameBuffer.mock.results[0].value,
                );
                expect(illusion.frameBuffer.setTexture).toHaveBeenCalledTimes(1);
                expect(canvas.transferToImageBitmap).toHaveBeenCalledTimes(1);
                expect(illusion.frameBuffer.setTexture).toHaveBeenCalledWith(
                    canvas.transferToImageBitmap.mock.results[0].value,
                );
            });
        });

        test('重置滤镜效果', async () => {
            const engine = illusion.engine;
            const layer1 = await engine.createLayer();
            const layer2 = await engine.createLayer();

            const filter1 = await engine.createFilterByType(FilterType.BLACK_IN);
            const filter2 = await engine.createFilterByType(FilterType.BILATERAL);

            await engine.addLayer(layer1);
            await engine.addLayer(layer2);

            await illusion.layer.addEffect(filter1);
            await illusion.layer.addEffect(filter2);
            jest.clearAllMocks();

            await illusion.resetFiltes();
            expect(engine.layers.length).toBe(1);
            expect(engine.layers[0]).toBe(illusion.layer);

            expect(illusion.layer.filters.length).toBe(0);
            expect(illusion.layer.setMixerType).toHaveBeenCalledWith(MixerType.NORMAL);
        });

        describe('添加滤镜效果', () => {
            test('添加滤镜效果', async () => {
                const engine = illusion.engine;
                const filters = [
                    await engine.createFilterByType(FilterType.BILATERAL),
                    await engine.createFilterByType(FilterType.CONTRAST),
                ];
                const layers = [
                    await engine.createLayer(),
                    await engine.createLayer(),
                    await engine.createLayer(),
                ];
                const mixer = engine.createMixerByType(MixerType.DARKEN);
                jest.clearAllMocks();

                await illusion.addEffect(filters, mixer, layers);
                illusion.layer.filters.forEach((filter, index) => {
                    expect(filter).toEqual(filters[index]);
                });
                expect(illusion.layer.setMixer).toHaveBeenCalledTimes(1);
                expect(illusion.layer.setMixer).toHaveBeenCalledWith(mixer);

                engine.layers
                    .filter((_, i) => i > 0)
                    .forEach((layer, i) => {
                        expect(layer).toEqual(layers[i]);
                    });
            });

            test('空值防错', async () => {
                await illusion.addEffect(undefined, null, undefined);
                expect(illusion.layer.addEffect).toHaveBeenCalledTimes(0);
                expect(illusion.layer.setMixerType).toHaveBeenCalledWith(MixerType.NORMAL);
                expect(illusion.layer.setMixer).toHaveBeenCalledTimes(0);
                expect(illusion.engine.addLayer).toHaveBeenCalledTimes(0);
            });
        });

        describe('渲染', () => {
            test('非离屏模式渲染', async () => {
                const canvas = await illusion.render();
                const context = canvas.getContext.mock.results[0].value;
                expect(illusion.engine.submit).toHaveBeenCalledTimes(1);
                expect(illusion.engine.submit).toHaveBeenCalledWith(0);
                const submitCanvas = await illusion.engine.submit.mock.results[0].value;

                expect(canvas).toBe(illusion.cacheCanvas);
                expect(canvas.width).toEqual(submitCanvas.width);
                expect(canvas.height).toEqual(submitCanvas.height);
                expect(context.clearRect).toHaveBeenCalledTimes(1);
                expect(context.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
                expect(context.drawImage).toHaveBeenCalledAfter(context.clearRect);
                expect(context.drawImage).toHaveBeenCalledWith(submitCanvas, 0, 0);
            });

            test('离屏模式渲染', async () => {
                jest.spyOn(illusion.engine, 'submit').mockImplementation(() => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 300;
                    canvas.height = 600;
                    canvas.close = jest.fn();
                    return canvas;
                });

                const canvas = await illusion.render();
                const submitCanvas = await illusion.engine.submit.mock.results[0].value;

                expect(canvas).toBe(illusion.cacheCanvas);
                expect(submitCanvas.close).toHaveBeenCalledTimes(1);
            });
        });

        describe('渲染滤镜素材', () => {
            test('正常流程', async () => {
                const setSourceImage = jest.spyOn(illusion, 'setSourceImage');
                const resetFiltes = jest.spyOn(illusion, 'resetFiltes');
                const loadMaterial = jest.spyOn(illusion, 'loadMaterial');
                const addEffect = jest.spyOn(illusion, 'addEffect');
                const render = jest.spyOn(illusion, 'render');
                const complexWithStrong = jest.spyOn(illusion, 'complexWithStrong');

                const image = document.createElement('img');
                const zipUrl = 'testUrl';
                const strong = 0.8;
                const cacheKey = 'testKey';

                const result = await illusion.renderMaterial(image, zipUrl, strong, cacheKey);
                expect(setSourceImage).toHaveBeenCalledWith(image);
                expect(resetFiltes).toHaveBeenCalledAfter(setSourceImage);
                expect(loadMaterial).toHaveBeenCalledAfter(resetFiltes);
                expect(loadMaterial).toHaveBeenCalledWith(zipUrl);

                const { filters, mixer, layers } = await loadMaterial.mock.results[0].value;
                expect(addEffect).toHaveBeenCalledWith(filters, mixer, layers);
                expect(render).toHaveBeenCalledAfter(addEffect);
                const canvas = await render.mock.results[0].value;
                const newCanvas = complexWithStrong.mock.calls[0][1];
                expect(newCanvas.width).toEqual(canvas.width);
                expect(newCanvas.height).toEqual(canvas.height);
                expect(complexWithStrong).toHaveBeenCalledWith(image, newCanvas, strong);
                expect(result).toEqual(complexWithStrong.mock.results[0].value);

                expect(illusion.cacheMap.has(cacheKey)).toBeTrue();
                await expect(illusion.cacheMap.get(cacheKey)).resolves.toEqual(canvas);

                // 重复缓存渲染
                const newResult = await illusion.renderMaterial(image, zipUrl, strong, cacheKey);
                expect(setSourceImage).toHaveBeenCalledTimes(1);
                expect(resetFiltes).toHaveBeenCalledTimes(1);
                expect(loadMaterial).toHaveBeenCalledTimes(1);
                expect(loadMaterial).toHaveBeenCalledTimes(1);
                expect(addEffect).toHaveBeenCalledTimes(1);
                expect(render).toHaveBeenCalledTimes(1);

                expect(complexWithStrong).toHaveBeenCalledTimes(2);
                expect(newResult).toEqual(complexWithStrong.mock.results[1].value);
            });

            test('无缓存渲染', async () => {
                const render = jest.spyOn(illusion, 'render');
                const complexWithStrong = jest.spyOn(illusion, 'complexWithStrong');

                const image = document.createElement('img');
                const zipUrl = 'testUrl';
                const strong = 0.8;
                const cacheKey = undefined;

                const result = await illusion.renderMaterial(image, zipUrl, strong, cacheKey);
                const canvas = await render.mock.results[0].value;
                const newCanvas = complexWithStrong.mock.calls[0][1];
                expect(newCanvas.width).toEqual(canvas.width);
                expect(newCanvas.height).toEqual(canvas.height);
                expect(complexWithStrong).toHaveBeenCalledWith(image, newCanvas, strong);
                expect(result).toEqual(complexWithStrong.mock.results[0].value);

                expect(illusion.cacheMap.size).toBe(0);
            });

            test('渲染失败移除缓存', async () => {
                jest.spyOn(illusion, 'render').mockImplementation(() => {
                    throw new Error('testError');
                });

                const image = document.createElement('img');
                const zipUrl = 'testUrl';
                const strong = 0.8;
                const cacheKey = 'testKey';

                await expect(
                    illusion.renderMaterial(image, zipUrl, strong, cacheKey),
                ).rejects.toThrow('testError');
                expect(illusion.cacheMap.size).toBe(0);

                // 无缓存
                await expect(illusion.renderMaterial(image, zipUrl, strong)).rejects.toThrow(
                    'testError',
                );
                expect(illusion.cacheMap.size).toBe(0);
            });
        });

        test('强度混合', async () => {
            // TODO: 结果验证
            const sourceImage = document.createElement('img');
            sourceImage.width = 300;
            sourceImage.height = 500;
            const resultImage = document.createElement('canvas');
            resultImage.width = 300;
            resultImage.height = 500;
            const result = illusion.complexWithStrong(sourceImage, resultImage, 0.7);
            expect(result.width).toEqual(sourceImage.width);
            expect(result.height).toEqual(sourceImage.height);
            const context = result.getContext.mock.results[0].value;
            expect(context.save).toHaveBeenCalledTimes(2);
            expect(context.restore).toHaveBeenCalledTimes(2);
            expect(context.drawImage).toHaveBeenCalledTimes(2);
            expect(context.drawImage).toHaveBeenCalledWith(sourceImage, 0, 0);
            expect(context.drawImage).toHaveBeenCalledWith(resultImage, 0, 0);
        });

        describe('销毁', () => {
            test('非离屏模式', async () => {
                illusion.engine.options.useWorker = false;
                const resetFiltersSpy = jest.spyOn(illusion, 'resetFiltes');
                const removeCanvasSpy = jest.spyOn(illusion.canvas, 'remove');
                const arrayBuffer = new ArrayBuffer(10);
                fetch.mockResponseOnce(() => {
                    return Promise.resolve({ body: arrayBuffer });
                });

                const zipUrl = 'http://www.gaoding.test.com/test.zip';
                const result = await illusion.loadMaterial(zipUrl);
                const frameBuffer = await illusion.engine.createFrameBuffer(300, 400);

                illusion.frameBuffer = frameBuffer;
                jest.clearAllMocks();
                await illusion.destory();

                expect(resetFiltersSpy).toHaveBeenCalledTimes(1);
                result.filters.forEach((filter) => {
                    expect(filter.destory).toHaveBeenCalledTimes(1);
                });
                result.layers.forEach((layer) => {
                    if (layer.source) {
                        expect(layer.source.destory).toHaveBeenCalledTimes(1);
                    }
                    if (layer.mixer) {
                        expect(layer.mixer.destory).toHaveBeenCalledTimes(1);
                    }
                    expect(layer.destory).toHaveBeenCalledTimes(1);
                });
                expect(frameBuffer.destory).toHaveBeenCalledTimes(1);
                expect(illusion.frameBuffer).toBeNull();
                expect(illusion.engine.destory).toHaveBeenCalledTimes(1);
                expect(removeCanvasSpy).toHaveBeenCalledTimes(1);
                expect(illusion.materialMap.size).toBe(0);
            });

            test('离屏模式', async () => {
                illusion.engine.options.useWorker = true;
                const removeCanvasSpy = jest.spyOn(illusion.canvas, 'remove');
                const arrayBuffer = new ArrayBuffer(1);
                fetch.mockResponseOnce(() => {
                    return Promise.resolve({ body: arrayBuffer });
                });

                const zipUrl = 'http://www.gaoding.test.com/test.zip';
                await illusion.loadMaterial(zipUrl);
                jest.clearAllMocks();
                await illusion.destory();
                expect(illusion.engine.destory).toHaveBeenCalledTimes(1);
                expect(removeCanvasSpy).toHaveBeenCalledTimes(0);
                expect(illusion.materialMap.size).toBe(0);
            });
        });
    });
});
