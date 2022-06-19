import Promise from 'bluebird';
import { uniq, set, get, isString, defaults } from 'lodash';
import VideoRenderer from '../../utils/renderer/video';
import { dataurlToBlob, bloburlToBlob, isDataUrl, isBlobUrl } from '@gaoding/editor-utils/binary';
import { checkDataUrl } from './check-dataurl';
import { murmurHash2 } from '@gaoding/editor-utils/hash';

import {
    editorResourceMap,
    urlToBlob,
    canvasToBlob,
    getComponentById,
    checkLoaded,
    getImageUrlByHash,
    setImageUrlByHash,
    getElementHash,
} from './utils';

const getEffectsBlob = async (element) => {
    const effectsKey = element.imageEffects ? 'imageEffects' : 'textEffects';
    const effects = element[effectsKey];
    const keys = [];

    if (!effects) return {};

    for (let i = 0; i < effects.length; i++) {
        const key = `${effectsKey}[${i}].filling.imageContent.image`;
        get(element, key) && keys.push(key);
    }

    return urlToBlob(element, keys);
};

const defaultResouceOptions = function (editor) {
    return {
        layout: async (layout) => {
            const resource = await urlToBlob(layout, [
                'background.image.url',
                'backgroundImage',
                'backgroundEffectImage',
                'border.image',
            ]);

            if (layout.backgroundEffectImage || !layout.hasFilters) return resource;

            const hash = murmurHash2(
                JSON.stringify({
                    ...layout.background.image,
                    ...get(layout, 'metaInfo.thirdParty', {}),
                }),
            );
            const imageUrlCache = getImageUrlByHash(hash);
            if (imageUrlCache) {
                resource.backgroundEffectImage = imageUrlCache;
                return resource;
            }

            const renderer = await editor.$renderers.get(layout.$id);
            const blob = await renderer?.exportBlob().catch(() => null);

            if (blob) {
                blob.hash = hash;
                resource.backgroundEffectImage = blob;
            }

            return resource;
        },
        chart: (element, options = {}) => {
            const { chartOptions = {} } = options;
            const { useCache = true } = chartOptions;
            // 是否有结果图缓存
            const hash = getElementHash(element);
            if (useCache) {
                const imageUrlCache = getImageUrlByHash(hash);
                if (imageUrlCache) return Promise.resolve({ imageUrl: imageUrlCache });
            }

            const component = getComponentById(editor, element.$id);
            if (!component) return Promise.resolve({});

            return new Promise((resolve, reject) => {
                checkLoaded(element, () => {
                    try {
                        // 图表报错，这里 $chartRender 会为 undefined，导致保存失败
                        component.$chartRender
                            .getCanvas()
                            .then((chartCanvas) => {
                                if (chartCanvas) {
                                    chartCanvas.toBlob(resolve, 'image/png');
                                }
                            })
                            .catch((e) => {
                                reject(e);
                            });
                    } catch (e) {
                        reject(e);
                    }
                });
            }).then((blob) => {
                blob.hash = hash;
                return {
                    imageUrl: blob,
                };
            });
        },
        table: (element) => {
            // 是否有结果图缓存
            const hash = getElementHash(element);
            const imageUrlCache = getImageUrlByHash(hash);
            if (imageUrlCache) return Promise.resolve({ imageUrl: imageUrlCache });

            const resource = {};
            const component = getComponentById(editor, element.$id);
            if (!component) return Promise.resolve({});

            return element.render(editor).then((canvas) => {
                return canvasToBlob(canvas, resource).then((resource) => {
                    resource.imageUrl.hash = hash;
                    return resource;
                });
            });
        },
        mask: (element) => {
            const urlPromises = urlToBlob(element, [
                'url',
                'mask',
                'metaInfo.thirdParty.matting.url',
                'metaInfo.thirdParty.imageEditor.url',
            ]);
            const imageUrlCache = editorResourceMap.get(element.$renderId);

            if (element.isGif || element.isApng) {
                return urlPromises;
            }

            if (!element.imageUrl && element.url && editor.$renderers.get(element.$id)) {
                return Promise.all([
                    urlPromises,
                    element.$renderId
                        ? imageUrlCache
                            ? Promise.resolve(imageUrlCache)
                            : editor.$renderers
                                  .get(element.$id)
                                  .exportBlob()
                                  .catch(() => null)
                        : '',
                ]).then(([resource, blob]) => {
                    if (blob) {
                        resource.imageUrl = blob;
                    }
                    return resource;
                });
            }
            return urlPromises;
        },
        image: (element) => {
            const urlPromises = urlToBlob(element, ['url']);
            const hasEffects = element.hasEffects || element.hasFilters;
            const imageUrlCache = editorResourceMap.get(element.$renderId);

            if (hasEffects && !element.imageUrl && editor.$renderers.get(element.$id)) {
                return Promise.all([
                    urlPromises,
                    imageUrlCache
                        ? Promise.resolve(imageUrlCache)
                        : editor.$renderers
                              .get(element.$id)
                              .exportBlob()
                              .catch(() => null),
                ]).then(([resource, blob]) => {
                    if (blob) {
                        resource.imageUrl = blob;
                    }
                    return resource;
                });
            }
            return urlPromises;
        },
        ninePatch: (element) => urlToBlob(element, ['url', 'imageUrl']),
        svg: (element) => {
            const resource = {};
            const { content } = element;

            if (content && content.length >= 5) {
                resource.content = new Blob([content], { type: 'image/svg+xml' });
            }

            return Promise.resolve(resource);
        },
        threeText: async (element) => {
            const hash = getElementHash(element);
            const imageUrlCache = getImageUrlByHash(hash);

            if (imageUrlCache) return Promise.resolve({ imageUrl: imageUrlCache });

            const component = getComponentById(editor, element.$id);
            const resource = {};
            if (!component || component.$refs.img) {
                return Promise.resolve(resource);
            }

            while (component.isRendering) {
                await Promise.delay(10);
            }

            const canvas = await editor.getThreeTextCanvas(element);
            return canvasToBlob(canvas, resource).then((resource) => {
                resource.imageUrl.hash = hash;
                return resource;
            });
        },
        effectText: async (element) => {
            const hash = getElementHash(element);
            const imageUrlCache = getImageUrlByHash(hash);
            if (imageUrlCache) return Promise.resolve({ imageUrl: imageUrlCache });

            const component = getComponentById(editor, element.$id);
            const resource = {};
            if (!component || component.$refs.img) {
                return Promise.resolve(resource);
            }
            // 等待渲染完成再出图，不然可能得到一张空白图片
            while (component.isRendering) {
                await Promise.delay(10);
            }
            return canvasToBlob(component.$refs.canvas, resource).then((resource) => {
                resource.imageUrl.hash = hash;
                return resource;
            });
        },
        cell: async (element) => urlToBlob(element, ['url']),
        watermark: async (element) => {
            return urlToBlob(element, ['imageUrl', 'url', 'logo.url', 'logo.defaultUrl']);
        },
        video: (element) => {
            const urlPromises = urlToBlob(element, ['url', 'mask']);
            const hash = getElementHash(element);
            const imageUrlCache = getImageUrlByHash(hash);

            if (imageUrlCache) {
                return urlPromises.then((resource) => {
                    resource.imageUrl = imageUrlCache;
                    return resource;
                });
            }

            const renderer = new VideoRenderer({ model: element, editor });
            return Promise.all([
                urlPromises,
                renderer.exportBlob({ exportType: element.mask ? 'image/png' : 'image/jpeg' }),
            ]).then(([resource, blob]) => {
                blob.hash = hash;
                if (blob) {
                    resource.imageUrl = blob;
                }
                return resource;
            });
        },
        async path(element) {
            const service = editor.services.cache.get('path');
            const blob = await service.renderToBlob(element);
            if (!blob) return {};
            blob.hash = getElementHash(element, [
                'path',
                'pathEffects',
                'width',
                'height',
                'rotate',
            ]);
            return {
                imageUrl: blob,
            };
        },
    };
};

const commonProps = [
    'border.image',
    'backgroundEffect.image.url',
    'metaInfo.thirdParty.imageEditor.url',
    'metaInfo.thirdParty.inpaint.url',
    'maskInfo.imageUrl',
    'metaInfo.thirdParty.matting.url',
    'background.image.url',
];
const uploadElementResources = (el, options = defaultResouceOptions) => {
    const handler = options[el.type || 'layout'];
    return Promise.all([
        urlToBlob(el, commonProps),
        getEffectsBlob(el),
        handler && handler(el, options),
    ]).then((resourcesList) => {
        return resourcesList.reduce((obj, resource) => {
            return Object.assign(obj, resource);
        }, {});
    });
};

export {
    editorResourceMap,
    urlToBlob,
    canvasToBlob,
    getComponentById,
    checkLoaded,
    getImageUrlByHash,
    setImageUrlByHash,
    getElementHash,
    uploadElementResources,
    defaultResouceOptions,
    checkDataUrl,
};

export async function exportResourceBlob(element, key, dataurl, editorOptions) {
    let blob;
    if (isDataUrl(dataurl)) {
        blob = await dataurlToBlob(dataurl);
    } else if (isBlobUrl(dataurl)) {
        blob = await bloburlToBlob(dataurl);
    }

    const cdnUrl = await editorOptions.resource.upload(blob, element, key);

    return cdnUrl;
}

export default (editor, layouts, options) => {
    options = defaults(options, {
        keepPrivateProps: [],
        exportTempletData: editor.exportTempletData,
        upload: (blob) => {
            const typeExtMap = {
                jpeg: 'jpg',
                'svg+xml': 'svg',
                png: 'png',
                gif: 'gif',
            };

            Object.keys(typeExtMap).forEach((key) => {
                if (blob.type.includes(key)) {
                    blob.name = '.' + typeExtMap[key];
                }
            });

            return Promise.try(() =>
                editor.options.resource.upload ? editor.options.resource.upload(blob) : '',
            );
        },
    });
    const { keepPrivateProps, upload } = options;

    const cleanMap = new Map();
    const oldValMap = new Map();
    let templet;

    return Promise.try(() => {
        const exportTempletData = options.exportTempletData || editor.exportTempletData;
        return exportTempletData(layouts, {
            keepPrivateProps: uniq(['$id', '$renderId', '$fallbackId'].concat(keepPrivateProps)),
            clean: false,
        });
    })
        .then((_templet) => {
            templet = _templet;
            templet.layouts.forEach((layout) => {
                cleanMap.set(layout.$id, layout);
            });

            editor.walkTemplet(
                (element) => {
                    cleanMap.set(element.$id, element);
                },
                true,
                templet.layouts,
            );

            return editor._exportResourceBlobs(layouts || editor.layouts);
        })
        .then((resources) => {
            // 上传进度条
            options.uploadCount = 0;
            options.materialsTotal = resources.length;

            editor.options.resource.uploadProgress &&
                editor.options.resource.uploadProgress(
                    options.uploadCount,
                    options.materialsTotal,
                    {},
                );

            return resources;
        })
        .map(
            (resource) => {
                const { element, layout } = resource;

                // 避免引用
                const copyElement = Object.assign({}, element);
                const copyLayout = Object.assign({}, layout);

                // 记录上传后的 url，在元素中的所有 blob 都上传完成后再修改 element，防止 mask 元素 url 变化后可能出现 imageUrl 异步更新问题
                const uploadedMap = {};
                const isImage = ['image', 'mask'].includes(copyElement.type);

                delete resource.element;
                delete resource.layout;

                return Promise.map(Object.keys(resource), (key) => {
                    const blob = resource[key];

                    if (isString(blob) && element) {
                        const cleanElement = cleanMap.get(copyElement.$id);
                        set(cleanElement, key, blob);
                        uploadedMap[key] = blob;
                        return;
                    } else if (isString(blob) && layout) {
                        const cleanLayout = cleanMap.get(copyLayout.$id);
                        set(cleanLayout, key, blob);
                        uploadedMap[key] = blob;
                        return;
                    }

                    if (element && element.type === 'svg' && key === 'content') {
                        key = 'url';
                    }

                    // 防止 base64 超过限制无法上传保存
                    const isImageUrl = isImage && key === 'imageUrl';

                    // 超过 12 MB 的图片清空 base64 位
                    if (isImageUrl && blob.size >= 12 * 1024 * 1024) {
                        const el = cleanMap.get(copyElement.$id);
                        if (el && get(el, key) === get(copyElement, key)) {
                            set(el, key, '');
                        }
                        return;
                    }

                    // 上传资源
                    return upload(blob, element, key).then((cdnUrl) => {
                        let oldVal;

                        if (layout) {
                            const cleanLayout = cleanMap.get(copyLayout.$id);
                            oldVal = get(cleanLayout, key);
                            oldValMap.set(copyLayout.$id + key, oldVal);

                            if (cleanLayout) {
                                set(cleanLayout, key, cdnUrl);
                            }

                            uploadedMap[key] = cdnUrl;
                        }

                        if (element) {
                            const cleanElement = cleanMap.get(copyElement.$id);
                            oldVal = get(cleanElement, key);
                            oldValMap.set(copyElement.$id + key, oldVal);

                            if (cleanElement) {
                                if (cleanElement.type === 'svg' && key === 'url') {
                                    cleanElement.content = '';
                                }
                                set(cleanElement, key, cdnUrl);
                            }

                            uploadedMap[key] = cdnUrl;
                        }

                        editor.options.resource.uploadProgress &&
                            editor.options.resource.uploadProgress(
                                options.uploadCount,
                                options.materialsTotal,
                                {
                                    key,
                                    url: cdnUrl,
                                    layout,
                                    element,
                                },
                            );

                        options.uploadCount += 1;

                        if (blob.hash) {
                            setImageUrlByHash(blob.hash, cdnUrl);
                        }

                        if (isImageUrl) {
                            editorResourceMap.set(copyElement.$renderId, cdnUrl);
                        } else if (oldVal && isString(oldVal)) {
                            editorResourceMap.set(oldVal, cdnUrl);
                        }

                        if (key === 'imageUrl') {
                            copyElement.$fallbackId &&
                                editor.$binding.yFallbackMap.set(copyElement.$fallbackId, {
                                    url: cdnUrl,
                                    ...(copyElement.effectedResult?.width
                                        ? {
                                              width: copyElement.effectedResult.width,
                                              height: copyElement.effectedResult.height,
                                              top: copyElement.effectedResult.top,
                                              left: copyElement.effectedResult.left,
                                          }
                                        : {}),
                                });
                        }

                        return cdnUrl;
                    });
                }).then(() => {
                    // 将结果赋值到元素
                    Object.keys(uploadedMap).forEach((key) => {
                        if (layout) {
                            const cleanLayout = cleanMap.get(layout.$id);
                            if (!cleanLayout) return;

                            // 上传过程中再次更改过
                            if (oldValMap.get(copyLayout.$id + key) !== get(layout, key)) return;
                            set(layout, key, uploadedMap[key]);
                            return;
                        }

                        if (key.includes('metaInfo.thirdParty')) {
                            set(element, key, uploadedMap[key]);
                        }

                        const cleanElement = cleanMap.get(element.$id);

                        // 上传过程中更改过的无需替换
                        if (!cleanElement) return;
                        if (oldValMap.get(copyElement.$id + key) !== get(element, key)) return;
                        if (isImage) return;

                        if (element.type === 'svg' && key === 'url') {
                            element.content = '';
                        }

                        set(element, key, uploadedMap[key]);
                    });
                });
            },
            {
                concurrency: 4, // 请求并发量控制
            },
        )
        .then(() => {
            const hasId = keepPrivateProps.includes('$id');
            const hasRenderId = keepPrivateProps.includes('$renderId');
            const hasFallbackId = keepPrivateProps.includes('$fallbackId');

            templet.layouts.forEach((layout) => {
                delete layout.$id;
            });

            editor.walkTemplet(
                (element) => {
                    const isImage = ['image', 'mask'].includes(element.type);

                    if (isImage && editorResourceMap.get(element.$renderId) && !element.imageUrl) {
                        element.imageUrl = editorResourceMap.get(element.$renderId);
                    }

                    if (!hasId) {
                        delete element.$id;
                    }

                    if (!hasRenderId) {
                        delete element.$renderId;
                    }

                    if (!hasFallbackId) {
                        delete element.$fallbackId;
                    }
                },
                true,
                templet.layouts,
            );

            oldValMap.clear();
            return templet;
        });
};
