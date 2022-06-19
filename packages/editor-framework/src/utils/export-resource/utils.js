import { get, isString, isObject, omitBy, omit, pick } from 'lodash';
import { LRUMap } from 'lru_map';
import editorDefaults from '../../base/editor-defaults';
import { createPromiseQueue } from '@gaoding/editor-utils/promise-queue';
import { murmurHash2 } from '@gaoding/editor-utils/hash';
import { isDataUrl, isBlobUrl, dataurlToBlob, bloburlToBlob } from '@gaoding/editor-utils/binary';
import loader from '@gaoding/editor-utils/loader';

// 异步任务队列
const queue = createPromiseQueue({
    timeout: 10000,
});

export const editorResourceMap = {
    data: new Map(),
    longData: new LRUMap(15),
    get(key) {
        return editorResourceMap.data.get(key) || editorResourceMap.longData.get(key);
    },
    set(key, val) {
        if (!key) return;

        let data = editorResourceMap.data;
        if (isString(key) && key.length > 100) {
            data = editorResourceMap.longData;
        } else {
            // 提前请求缓存资源
            queue.run(val, () => {
                return loader.loadImage(val, false, true);
            });
        }
        data.set(key, val);
    },
};
if (process.env.NODE_ENV === 'development') {
    window.editorResourceMap = editorResourceMap;
}

export const urlToBlob = (element, mapKeys) => {
    const resource = {};
    const promises = [];
    mapKeys.forEach((key) => {
        const url = get(element, key);

        if (editorResourceMap.get(url)) {
            resource[key] = editorResourceMap.get(url);
        } else if (isDataUrl(url)) {
            resource[key] = dataurlToBlob(url);
        } else if (isBlobUrl(url)) {
            promises.push(
                bloburlToBlob(url).then((blob) => {
                    resource[key] = blob;
                }),
            );
        }
    });

    return Promise.all(promises).then(() => resource);
};

export const canvasToBlob = (canvas, resource) => {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/png');
    }).then((blob) => {
        resource.imageUrl = blob;
        return resource;
    });
};

// 多页面模式下可能拿不到 component
export const getComponentById = function (editor, id) {
    let component = editor.getComponentById(id);
    if (!component) {
        // 从preview layout获取元素
        const el = document.querySelector(`.editor-element[data-id="${id}"]`);
        component = el && el.__vue__;
    }

    return component;
};

export const checkLoaded = function checkLoaded(ele, callback) {
    const awaitTime = 200;
    setTimeout(() => {
        if (ele.$loaded) {
            callback();
        } else {
            checkLoaded(ele, callback);
        }
    }, awaitTime);
};

// 过滤与出图不相关的属性
const hashIgnoreProps = omit(Object.assign({}, editorDefaults.element, { imageUrl: true }), [
    'padding',
    'width',
    'height',
    'transform',
    'title',
]);

const hashIgnoreTypes = [
    'mask',
    'image',
    'group',
    'text',
    'flex',
    'svg',
    'watermark',
    'ninePatch',
].reduce((obj, k) => {
    obj[k] = true;
    return obj;
}, {});

export const getElementHash = function (element, propsName) {
    if (!element.imageUrl || hashIgnoreTypes[element.type]) return;

    let props = [];
    if (propsName) {
        props = pick(element, propsName);
    } else {
        props = omitBy(element, (v, k) => {
            return k[0] === '$' || hashIgnoreProps[k] !== undefined;
        });
    }

    const hash = murmurHash2(JSON.stringify(props));
    return hash;
};

export const getImageUrlByHash = function (hash) {
    hash = isObject(hash) && hash.type ? getElementHash(hash) : hash;
    return hash && editorResourceMap.get(hash);
};

export const setImageUrlByHash = function (hash, imageUrl) {
    hash = isObject(hash) && hash.type ? getElementHash(hash) : hash;
    return hash && editorResourceMap.set(hash, imageUrl);
};

if (process.env.NODE_ENV === 'development') {
    window.editorResourceMap = editorResourceMap;
}
