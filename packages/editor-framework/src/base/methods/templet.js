/**
 * @class EditorTempletMixin
 * @description 编辑器模板整体操作相关API
 */
import { merge, defaults, debounce, get, noop, isFunction, cloneDeep } from 'lodash';
import Promise from 'bluebird';
import tinycolor from 'tinycolor2';
import utils, { serialize } from '../../utils/utils';
import { styleMap } from '../../utils/rich-text/config';
import { LayerPicker } from '../../utils/layer-picker/src/layer-picker';
import editorDefaults from '../editor-defaults';

import { getAdaptationImageTransform } from '../../utils/model-adaptation';
import exportResources, {
    defaultResouceOptions,
    uploadElementResources,
    setImageUrlByHash,
} from '../../utils/export-resource';
import { walkTemplet } from '@gaoding/editor-utils/templet';

function removeDuplicateUuid(layouts) {
    const uuidMap = new Map();
    const deleteFn = (el) => {
        if (!el.uuid) return;
        if (!uuidMap.get(el.uuid)) {
            uuidMap.set(el.uuid, el.uuid);
        } else {
            delete el.uuid;
        }
    };

    layouts.forEach(deleteFn);

    walkTemplet(deleteFn, true, layouts);
}

export default (asyncElementsMap) => ({
    // status
    _checkTempletLoaded() {
        const { options, global } = this;

        const unloadLayouts = this.layouts.filter((layout) => {
            return !layout.$loaded;
        });

        if (!unloadLayouts.length && global.$loaded) {
            return;
        }

        let count = 0;
        unloadLayouts.forEach((layout) => {
            let elementsUnloaded = false;
            this.walkTemplet(
                (element) => {
                    if (!element.$loaded) {
                        elementsUnloaded = true;
                        return false;
                    }
                },
                true,
                [layout],
            );

            if (
                !elementsUnloaded &&
                (!get(layout, 'background.image') || layout.$backgroundLoaded) &&
                (!layout.border.enable || layout.border.$loaded)
            ) {
                layout.$loaded = true;
                count += 1;

                // 存在文字时需要更新选区
                if (this.supportTypes.includes('text')) {
                    this.updateCurrentSelection();
                }
                this.$emit('layoutLoaded', layout);
            }
        });

        // 判断水印加载完成
        if (!this.$watermarkLoadPromsie) {
            const watermarkEnable = this.layouts.some(
                (layout) => layout.watermarkEnable || get(layout, 'background.watermarkEnable'),
            );
            const hasWatermark =
                global.showWatermark || !!get(global, 'layout.watermarkEnable') || watermarkEnable;
            this.$watermarkLoadPromsie = hasWatermark
                ? Promise.map(
                      [
                          options.watermarkImages.layoutRepeat,
                          options.watermarkImages.layoutNoRepeat,
                      ],
                      (url) => {
                          return url && utils.loadImage(url);
                      },
                  )
                : Promise.resolve();
        }

        if (
            count >= unloadLayouts.length &&
            (!get(global, 'layout.backgroundImage') || global.$backgroundLoaded)
        ) {
            this.$watermarkLoadPromsie.finally(() => {
                global.$loaded = true;
                global.$rendered = true;
                this.$emit('templetLoaded');
            });
        }
    },

    checkTempletLoaded() {
        if (!this.checkTempletLoadedLazy) {
            this.checkTempletLoadedLazy = debounce(this._checkTempletLoaded, 96);
        }

        this.checkTempletLoadedLazy();
    },

    /**
     * 重置清空模板
     * @memberof EditorTempletMixin
     */
    resetTemplet() {
        this.resetSnapshot();
        this.resetDataSource();

        this.currentLayout = null;
        this.currentElement = null;
        this.layouts = [];
    },

    /**
     * 导入模板
     * @param {Object} tpl 模板数据JSON
     * @param {Number} defaultIndex 设置为 currentLayout 的索引
     * @memberof EditorTempletMixin
     * @returns {Promise}
     */
    async setTemplet(tpl, defaultIndex = 0, fromRemote = false) {
        console.log(tpl, 'fromRemote: ' + fromRemote);

        // 队列避免同时 yjs 远程同步跟外部同时 setTemplet 导致乱序异常
        this._setTempletPromise = this._setTempletPromise || Promise.resolve();

        this.$snapshots.callbackEnable = false;

        this._setTempletPromise = Promise.try(() => {
            return this._setTempletPromise.catch(noop);
        })
            .then(() => {
                if (!tpl) {
                    throw new Error('No templet give');
                }
                removeDuplicateUuid(tpl.layouts);

                // reset
                this.resetTemplet();
                return this.autoImportElementByTemplet(tpl);
            })
            // global, type
            .then(async () => {
                this.global = merge(this.global, tpl.global);
                // 对于二次编辑的剪辑模板，如果elements中有异步元素，需保证该异步元素组件被提前加载完成
                // 在元素异步包里面的，没有按需引入的异步引入
                const keys = Object.keys(asyncElementsMap);
                await Promise.all(
                    keys.map((type) => {
                        if (
                            !this.supportTypes.includes(type) &&
                            !isFunction(asyncElementsMap[type])
                        ) {
                            return this.createAsyncComponent({ type });
                        }
                        return null;
                    }),
                );

                // reset
                this.global.zoom = 1;

                // loaded status
                this.global.$loaded = false;

                // type
                this.type = tpl.type || this.global.type || 'poster';
                return null;
            })
            // layouts
            .then(async () => {
                let layouts = tpl.layouts || [];
                layouts = layouts.filter((layout) => !!layout);

                if (!layouts.length) {
                    layouts.push({});
                }

                // 初始化字体子集
                this.loadFontSubset(layouts);

                this.toggleSnapshot(false);
                layouts = layouts.map((layout) => {
                    return this.addLayout(layout);
                });
                this.toggleSnapshot(true);

                !fromRemote &&
                    this.$binding.commit({
                        tag: 'set_templet',
                        layouts,
                        global: this.global,
                    });

                // default layout
                this.currentLayout = this.layouts[defaultIndex];
                return null;
            })
            // reset history
            .then(() => {
                this.resetSnapshot();

                return this.$nextTick();
            })
            // ready
            .then(() => {
                this.$picker = new LayerPicker({
                    defaultSize: this.options.layerPickerDefaultSize,
                });

                this.$emit('templetCreated');
                this.$snapshots.callbackEnable = true;

                // loaded check
                this.checkTempletLoaded();

                // init imageurl cache
                this.walkTemplet(
                    (el) => {
                        el.imageUrl && setImageUrlByHash(el, el.imageUrl);
                    },
                    true,
                    this.layouts,
                );

                return null;
            });

        return this._setTempletPromise;
    },

    /**
     * 导出模板
     * @memberof EditorTempletMixin
     * @param {Object} options 替换参数
     * @param {Boolean}[options.keepPrivateProps] 允许返回 $ 开头的私有字段
     * @param {Boolean}[options.clean] 导出时自动上传 base64、blob url 等私有字段
     * @param {Boolean}[options.exportTempletData] 序列化编辑器模板
     */
    exportTemplet(layouts, options) {
        options = defaults(options, {
            keepPrivateProps: [],
            exportTempletData: this.exportTempletData,
            clean: false,
        });

        layouts = cloneDeep(layouts || this.layouts);

        if (options.clean && get(this, 'options.resource.upload')) {
            return exportResources(this, layouts, options).then(JSON.stringify);
        }

        const restoreTempGroup = (tpl) => {
            const tempGroup = this.$refs.tempGroup;
            const currentTempGroupId = tempGroup && this.$refs.tempGroup.currentTempGroupId;
            if (currentTempGroupId) {
                tpl.layouts = tpl.layouts.map((item) => {
                    const layout = { ...item };
                    const elmenets = this._restoreTempGroup(layout);
                    layout.elements = elmenets;
                    return layout;
                });
            }
        };

        const tpl = {
            version: this.version,
            // version: '6.0.0',
            type: this.type,
            global: this.global,
            layouts: layouts || [],
        };

        // 临时组导出时复原为完整的 group
        restoreTempGroup(tpl);
        return this.deserializeModel(tpl, options);
    },
    exportTempletData(layouts, options) {
        layouts = layouts || this.layouts;
        const promise = this.exportTemplet(layouts, options).then((content) => {
            return JSON.parse(content);
        });

        return promise;
    },

    _exportResourceBlobs(layouts = this.layouts, options) {
        const defaultOptions = defaultResouceOptions(this);

        options = defaults(options, defaultOptions);

        const elementResults = this.walkTemplet(
            (element) => {
                // 暂不支持非pen path元素
                const isSupportType =
                    (this.supportTypesMap[element.type] || layouts !== this.layouts) &&
                    (element.type !== 'path' ||
                        this.services.cache.get('path').canEditPath(element));

                if (isSupportType) {
                    return uploadElementResources(element, options).then((resource) => {
                        if (resource) {
                            resource.element = element;
                        }

                        return resource;
                    });
                }

                return null;
            },
            true,
            layouts,
        ).then((results) => {
            return results.filter((resource) => resource && Object.keys(resource).length > 1);
        });

        const layoutResults = Promise.map(layouts, (layout) => {
            const handler = options.layout;

            return (
                handler &&
                uploadElementResources(layout, options).then((resource) => {
                    if (resource) {
                        resource.layout = layout;
                    }

                    return resource;
                })
            );
        }).then((results) => {
            return results.filter((resource) => resource && Object.keys(resource).length > 1);
        });

        return Promise.all([elementResults, layoutResults]).then(
            ([elementResults, layoutResults]) => {
                return [].concat(elementResults, layoutResults);
            },
        );
    },
    /**
     * 导出可上传资源的 blob
     * @memberof EditorTempletMixin
     * @param {Array.<layout>} layouts 多个 layout
     * @param {Object} options 替换参数
     * @param {Boolean}[options.contentLimit] 大于限定字符，才满足 转blob 条件
     * @param {Function} [options.[mask|svg|image]] - 自定义处理并返回一个 promise，其返回的参数将添加到 resources 数组
     * @return {Promise}
     * @example
     * editor.exportResourceBlobs().then(resources => { console.log(resources) })
     */
    exportResourceBlobs(layouts = this.layouts, options) {
        return this._exportResourceBlobs(layouts, options).then((results) => {
            return results.filter((item) => {
                if (item.imageUrl && !(item.imageUrl instanceof Blob)) {
                    delete item.imageUrl;
                }

                // elment、layout 为保留属性
                return Object.keys(item).length > 1;
            });
        });
    },

    /**
     * 深度遍历元素
     * @memberof EditorTempletMixin
     * @param {Function} callbak 回调 (element, parent, index) => {} // return false; 可中断遍历
     * @param {Boolean} deep 是否深度遍历
     * @param {Array.<layout>} layouts 多个 layout
     * @return {Promise}
     * @example
     * editor.walkTemplet(el => { return Promise.resolve('example'); }, true, layouts)
     */
    walkTemplet(callbak, deep = true, layouts = this.layouts) {
        return utils.walkTemplet(callbak, deep, layouts);
    },
    /**
     * 导出元素
     */
    exportElement(element, options) {
        return this.deserializeModel(element, options);
    },
    /**
     * 反序列model
     * @param {*} model
     * @param {*} options
     * @return {Promise}
     */
    deserializeModel(model, options) {
        options = defaults(options, {
            keepPrivateProps: [],
            clean: false,
        });
        const promise = Promise.bind(this);
        return promise.then(() => {
            const propsMap = {};
            options.keepPrivateProps.forEach((key) => {
                propsMap[key] = true;
            });

            // 判断颜色的属性是否是有效的颜色值，是则输出为 8 位 hex 值，否则返回原值
            const colorToHex8 = (v) => {
                if (v && typeof v === 'string') {
                    const color = tinycolor(v);
                    return color.isValid() ? color.toString('hex8') : v;
                }
                return v;
            };

            return JSON.stringify(model, (k, v) => {
                if (k[0] === '$' && !propsMap[k]) {
                    return;
                }

                if (
                    (k === 'color' || k === 'backgroundColor' || k === 'stroke' || k === 'fill') &&
                    typeof v === 'string'
                ) {
                    return colorToHex8(v);
                }

                if (k === 'colors' || k === 'aggregatedColors') {
                    if (v instanceof Array) {
                        // Array
                        return v.map((color) => colorToHex8(color));
                    } else {
                        // Object
                        const result = {};
                        for (const key in v) {
                            result[key] = colorToHex8(v[key]);
                        }
                        return result;
                    }
                }

                if (k === 'fontFamily') {
                    const { fontsMap, defaultFont } = this.options;
                    const font = fontsMap[v] || defaultFont;
                    // web展示优先取family、数据输出优先取name值
                    return font.name || font.family || v;
                }

                // textElement.contents
                if (
                    v &&
                    typeof v === 'object' &&
                    v.type === 'text' &&
                    v.contents instanceof Array &&
                    v.contents.length
                ) {
                    const contents = serialize.mergeChild(v.contents);
                    // 从 dom 通过 textContent 或 innerHTML 获取的空格 unicode 160 app 暂无法识别，需改为输入为 unicode 32
                    contents.forEach((item) => {
                        item.content = item.content.replace(/\u00A0/g, ' ');
                    });

                    // 只有一个子级简化为content
                    if (contents.length === 1) {
                        v = JSON.parse(JSON.stringify(v));

                        v.content = contents[0].content;
                        Object.keys(contents[0]).forEach((name) => {
                            if (
                                Object.prototype.hasOwnProperty.call(
                                    editorDefaults.textElement,
                                    name,
                                ) &&
                                styleMap[name]
                            ) {
                                v[name] = contents[0][name];
                            }
                        });

                        v.contents = null;
                    } else if (v.content) {
                        v.content = v.content.replace(/\u00A0/g, ' ');
                    }
                }

                // 将 imageWidth imageHeight -> imageTransform scale
                if (
                    v &&
                    v.parseTransform &&
                    typeof v === 'object' &&
                    ['image', 'mask'].includes(v.type) &&
                    v.$id
                ) {
                    v = Object.assign({}, v, {
                        imageTransform: getAdaptationImageTransform(v),
                    });
                }

                if (v && v.exportData) {
                    return v.exportData(this);
                }

                // shadows -> effect shadow
                // 转为旧数据兼容旧编辑器，方案文档：https://doc.huanleguang.com/pages/viewpage.action?pageId=213112415
                if (
                    v &&
                    typeof v === 'object' &&
                    ['text', 'mask', 'effectText', 'image'].includes(v.type) &&
                    v.$id
                ) {
                    const isText = ['text', 'effectText'].includes(v.type);
                    const effects = isText ? v.textEffects : v.imageEffects;

                    // 获取新数据对应的旧数据结构
                    const getOldShadow = (newShadow, inset = false) => {
                        const oldShadow = cloneDeep(newShadow);

                        oldShadow.type = 'shadow';
                        oldShadow.inset = inset;
                        return oldShadow;
                    };

                    // 特效数据转化
                    effects.forEach((effect) => {
                        if (effect.insetShadow) {
                            effect.shadow = getOldShadow(effect.insetShadow, true);
                        }
                        if (effect.filling && typeof effect.filling.type === 'string') {
                            const mapColorType = ['color', 'image', 'gradient'];
                            effect.filling.type = mapColorType.indexOf(effect.filling.type);
                            if (effect.filling.type === -1) {
                                effect.filling.type = 0;
                            }
                        }
                    });

                    // 投影
                    if (v.shadows) {
                        // 是否存在有效特效
                        const hasEffects = effects.some((ef) => ef.enable);
                        // 筛选出基础投影
                        let shadowEffects = v.shadows.filter((shadow) => shadow.type === 'base');
                        // 第一个有效投影
                        const firstEnableShadow = shadowEffects.find((sh) => sh.enable);

                        // 构造 effect 数据结构
                        shadowEffects = shadowEffects.map((shadow) => ({
                            enable: true,
                            filling: {
                                // 不存在特效数据且第一个有效投影的为 false，否则为 true
                                enable: hasEffects || firstEnableShadow !== shadow,
                                type: 0,
                                color: '#00000000',
                            },
                            shadow: getOldShadow(shadow),
                        }));

                        // 投影数据加在最后面
                        const newEffects = effects.concat(shadowEffects);
                        isText ? (v.textEffects = newEffects) : (v.imageEffects = newEffects);
                    }
                }

                return v;
            });
        });
    },
});
