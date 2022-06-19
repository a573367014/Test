import $ from '@gaoding/editor-utils/zepto';
import { forEach, isEmpty, merge, cloneDeep, escapeRegExp } from 'lodash';
import tinycolor from 'tinycolor2';

import utils from '@gaoding/editor-framework/src/utils/utils';
import inherit from '@gaoding/editor-framework/src/utils/vue-inherit';
import BaseElement from '@gaoding/editor-framework/src/base/base-element';
import { isGroup } from '@gaoding/editor-utils/element';

import template from './svg-element.html';
import {
    initMaskInfo,
    debounceUpdateMaskInfo,
} from '@gaoding/editor-framework/src/static/mask-wrap/utils';

export default inherit(BaseElement, {
    name: 'svg-element',
    template,
    data() {
        return {
            svg: null,
            isContainer: false,
            viewBox: [null, null, null, null],
            boxes: {
                container: null,
                nw: null,
                n: null,
                ne: null,
                w: null,
                c: null,
                e: null,
                sw: null,
                s: null,
                se: null,
            },
            errorMessage: '',
        };
    },
    computed: {
        // 解决同一个页面内存在多个 layout 导致 svg defs 里面的 id 重复
        tempId() {
            return (
                String(this.model.$id).replace(/[^\w]/g, '').substr(0, 4) +
                Math.floor(Math.random() * 1000)
            );
        },

        isDesign() {
            return this.options.mode === 'design' || this.options.mode === 'flow';
        },
        supportTransform() {
            return !!this.model.containerTransform;
        },
        cssStyle() {
            const { rect } = this;
            const { padding } = rect;

            return {
                height: rect.height + padding[0] + padding[2] + 'px',
                width: rect.width + padding[1] + padding[3] + 'px',
            };
        },
    },
    methods: {
        load() {
            const { model } = this;
            const { content, url } = model;
            // initMaskInfo(this.model, this.editor);
            if (content) {
                return utils.parseXML(content);
            }

            return utils.loadXML(url);
        },
        buildSvg(xml) {
            xml = $(xml);
            this.fixSvgAttrs(xml);

            const rColorProps = /(fill|stroke|stop-color)="([^{}]*?)"/g;
            const rColorAttrs = /(fill|stroke|stop-color)="{{(.*?)}}"/g;

            let html = this.serializeXML(xml[0]);

            // 避免前端出图失败
            html = html.replace(/xmlns:xlink="http[^"]*"/g, '');

            // Vue 解析模板会忽略嵌入的 style 标签，用 <svg:style></svg:style> 避免
            html = html.replace(/(<\/?)style>/gi, '$1svg:style>');

            // 多个 SVG 处于同一 DOM 环境下时会导致 id/class 冲突，规避处理
            const uniqueKeyBlocks = new Set();
            const tmpId = this.tempId;
            html = html.replace(/\s(id|class)=(['"])([^'"]+)\2/g, (a, key, c, val) => {
                uniqueKeyBlocks.add(`${key === 'id' ? '#' : '.'}${val}`);

                return ` ${key}="${val}_${tmpId}"`;
            });
            Array.from(uniqueKeyBlocks).forEach((k) => {
                const re = new RegExp(escapeRegExp(k) + '([)\\b\\s\'"])', 'g');

                html = html.replace(re, (a, brackets) => {
                    return `${k}_${tmpId}` + brackets;
                });
            });

            // 安卓浏览器显示异常，避免存在 hex8 色值
            html = html.replace(rColorProps, (str, key, value) => {
                if (!value || !tinycolor(value).isValid()) return str;
                return `${key}="${tinycolor(value).toString('rgb')}"`;
            });

            // 兼容 Vue2
            // 示例形如 fill="{{colors['aaa']}}" => :fill="rgbacolors['aaa']"
            html = html.replace(rColorAttrs, ' :$1="rgba$2"');
            // 元素只具备 url 属性时存储 XML 内容
            this.model.$content = html;

            this.errorMessage = '';
            this.loading = false;

            // 将未添加变换的原始 SVG 插入 Element 所在 DOM 中
            const panel = $('.element-main', this.$el);
            panel.html(html);

            // Vue constructor shim
            let Vue = this.constructor;
            while (Vue.super) {
                Vue = Vue.super;
            }

            // 初始化 BBox
            this.viewBox = (
                $(html).filter('svg').attr('viewBox') ||
                $(html).find('svg').attr('viewBox') ||
                '0 0 0 0'
            )
                .split(' ')
                .map((x) => parseInt(x, 10));

            if (this.isContainer) {
                this.boxes = this.getBBoxes();
            }

            const elementVM = this;

            // 用于控制 SVG 变化的子级动态 Vue 组件
            const svgVM = {
                tempId: this.tempId,
                isContainer: this.isContainer,
                el: panel[0],
                // 这里需要浅拷贝，否者 model 上 __ob__.vmCount > 0，会被识别成 vue 实例，导致其他问题
                computed: {
                    width() {
                        return elementVM.model.width;
                    },
                    height() {
                        return elementVM.model.height;
                    },
                    containerTransform() {
                        return elementVM.model.containerTransform;
                    },
                    rgbacolors() {
                        if (!elementVM.model.colors) return {};
                        return Object.keys(elementVM.model.colors).reduce((obj, key) => {
                            const color = tinycolor(elementVM.model.colors[key]);
                            return { ...obj, [key]: color.toRgbString() };
                        }, {});
                    },
                },
                methods: {
                    // 从父级 ElementSVG 组件中获取变换 box 参数
                    // 配合该 SVG Vue 实例中获取当前变换参数
                    // 以生成各 grid 最终 SVG 变换配置
                    getComputedTransform(dir) {
                        if (!this.containerTransform) {
                            return null;
                        }

                        const { sx, sy, tx, ty } = this.containerTransform[dir];
                        const box = elementVM.boxes[dir];

                        if (!box) {
                            return null;
                        }
                        const [mx, my] = [box.x + box.width / 2, box.y + box.height / 2];

                        // TODO 合并变换矩阵
                        return `translate(${tx} ${ty}) translate(${mx} ${my}) scale(${sx} ${sy}) translate(${-mx} ${-my})`;
                    },
                    grapHack(num) {
                        // 解决 svg 拼接缝隙
                        if (this.$options.isContainer) {
                            const data = {
                                nw: `translate(${num}, ${num})`,
                                sw: `translate(${num}, -${num})`,
                                n: `translate(0, ${num})`,
                                s: `translate(0, -${num})`,
                                ne: `translate(-${num}, ${num})`,
                                se: `translate(-${num}, -${num})`,
                                w: `translate(${num}, 0)`,
                                c: 'translate(0, 0)',
                                e: `translate(-${num}, 0)`,
                            };

                            ['se', 's', 'sw', 'e', 'c', 'w', 'ne', 'n', 'nw'].forEach((dir) => {
                                const className = `.editor-svg-${dir}_${this.$options.tempId}`;
                                $(className, this.$el).attr('transform', data[dir]);
                            });
                        }
                    },
                },
                mounted() {
                    // this.$watch('containerTransform.scale', {
                    //     immediate: true,
                    //     handler() {
                    //         this.grapHack(1);
                    //     }
                    // });
                },
            };

            if (this.isContainer) {
                svgVM.computed = {
                    viewBox() {
                        const [x1, y1] = elementVM.viewBox;
                        return `${x1} ${y1} ${x1 + this.width} ${y1 + this.height}`;
                    },

                    tScale() {
                        if (!this.containerTransform) {
                            return null;
                        }

                        return `scale(${this.containerTransform.scale})`;
                    },

                    tNW() {
                        return this.getComputedTransform('nw');
                    },
                    tN() {
                        return this.getComputedTransform('n');
                    },
                    tNE() {
                        return this.getComputedTransform('ne');
                    },
                    tW() {
                        return this.getComputedTransform('w');
                    },
                    tC() {
                        return this.getComputedTransform('c');
                    },
                    tE() {
                        return this.getComputedTransform('e');
                    },
                    tS() {
                        return this.getComputedTransform('s');
                    },
                    tSE() {
                        return this.getComputedTransform('se');
                    },
                    tSW() {
                        return this.getComputedTransform('sw');
                    },
                };
            }

            elementVM.svg = new Vue(svgVM);

            // clean
            elementVM.$on('destroy', () => {
                if (elementVM.svg) {
                    elementVM.svg.$destroy(true, true);
                }
            });
        },

        fixSvgAttrs(xml) {
            const { model } = this;
            const customColorClass = '.editor-props-color';

            // 需保留的属性
            const propParsers = {
                xmlns: String,
                preserveAspectRatio: String,
                viewBox: String,
                x: parseInt,
                y: parseInt,
            };

            let uid = 0;
            const colors = {};
            const colorsMap = {};
            const addCustomColor = (node, name) => {
                const val = node.getAttribute(name);
                let k = colorsMap[val];

                if (!k) {
                    k = colorsMap[val] = 'color_p_' + ++uid;

                    colors[k] = val;
                }

                node.setAttribute(`:${name}`, `colors.${k}`);
            };

            xml.children('svg').each((i, node) => {
                node = $(node);

                const attributes = [].slice.call(node[0].attributes);

                // svg attrs fix
                forEach(attributes, (item) => {
                    const prop = item.name;
                    if (propParsers[prop]) {
                        const parser = propParsers[prop];
                        const val = parser(node.attr(prop));
                        node.attr(prop, val);
                    } else {
                        node.removeAttr(prop);
                    }
                });

                // custom colors
                node.find(customColorClass).each((i, node) => {
                    // svg color props:
                    // fill, stroke, stop-color(xGradient)
                    if (node.hasAttribute('fill')) {
                        addCustomColor(node, 'fill');
                    }

                    if (node.hasAttribute('stroke')) {
                        addCustomColor(node, 'stroke');
                    }
                });

                node.attr(':width', 'Math.max(1, width)');
                node.attr(':height', 'Math.max(1, height)');

                this.isContainer = !!node.has('.editor-svg-container').length;
                if (this.isContainer) {
                    node.attr(':view-box.camel', 'viewBox');

                    node.find('.editor-svg-container').each((i, container) => {
                        $(container).attr(':transform', 'tScale');
                    });

                    const dirs = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'];

                    dirs.forEach((dir) => {
                        const computedName = 't' + dir.toUpperCase();
                        node.find(`.editor-svg-${dir} *`).each((i, grid) => {
                            $(grid).attr(':transform', computedName);
                        });
                    });
                }
            });

            // set props colors
            if (!isEmpty(colors)) {
                model.colors = merge(colors, model.colors);
            }
        },

        getBBox(name) {
            const className = `editor-svg-${name}_${this.tempId}`;
            const el = this.$el.getElementsByClassName(className);

            return el[0] && el[0].getBBox();
        },

        getContainerBBox() {
            return {
                width: this.model.width,
                height: this.model.height,
                x: this.left,
                y: this.top,
            };
        },

        getBBoxes() {
            const { getBBox, getContainerBBox } = this;

            return {
                container: getContainerBBox(),
                se: getBBox('se'),
                s: getBBox('s'),
                sw: getBBox('sw'),
                e: getBBox('e'),
                c: getBBox('c'),
                w: getBBox('w'),
                ne: getBBox('ne'),
                n: getBBox('n'),
                nw: getBBox('nw'),
            };
        },

        setTransform(dir, key, value) {
            const { containerTransform } = this.model;
            if (!containerTransform || !containerTransform[dir]) {
                return;
            }
            containerTransform[dir][key] = value;
        },

        resizeInit(dir) {
            if (!this.isContainer) {
                return;
            }

            this.$svgResizeMeta = {
                dir,
                originalBoxes: this.boxes,
                currentBoxes: this.getBBoxes(),
                containerTransform: cloneDeep(this.model.containerTransform),
                width: this.model.width,
                height: this.model.height,
            };
        },

        resizeEnd() {
            delete this.$svgResizeMeta;
        },

        setScale(value) {
            if (!this.model.containerTransform) {
                return;
            }

            this.model.containerTransform.scale = value;
        },

        setSize({ dir, dx, dy }) {
            const { $svgResizeMeta, setTransform, setScale } = this;
            const { $minWidth, $minHeight } = this.model;

            if (!$svgResizeMeta) {
                return;
            }

            // originalBoxes 为 SVG 元素未加变换时的 BBox 集合
            // currentBoxes 为拖拽开始时经变换后的 BBox 集合
            // currentTransform 为拖拽开始时的变换参数
            const { containerTransform, originalBoxes, currentBoxes } = $svgResizeMeta;

            if (!containerTransform) {
                return;
            }

            const currentTransform = containerTransform;

            const currentScale = currentTransform.scale;

            if ($minWidth) {
                dx = Math.max($minWidth - currentBoxes.container.width, dx);
            }
            if ($minHeight) {
                dy = Math.max($minHeight - currentBoxes.container.height, dy);
            }

            // 横向缩放时，分别更改九宫格中部与右侧组变换参数
            if (dir === 'w' || dir === 'e') {
                const middleGroup = ['n', 'c', 's'];
                middleGroup.forEach((dir) => {
                    const baseTx = currentTransform[dir].tx;
                    const originalWidth = originalBoxes[dir].width;
                    const baseWidth = currentBoxes[dir].width;

                    setTransform(dir, 'sx', (baseWidth + dx / currentScale) / originalWidth);
                    setTransform(dir, 'tx', baseTx + dx / currentScale / 2);
                });

                const rightGroup = ['ne', 'e', 'se'];
                rightGroup.forEach((dir) => {
                    const baseTx = currentTransform[dir].tx;
                    setTransform(dir, 'tx', baseTx + dx / currentScale);
                });
            }

            // 纵向缩放时，分别更改九宫格中部与下侧组变换参数
            else if (dir === 'n' || dir === 's') {
                const middleGroup = ['w', 'c', 'e'];
                middleGroup.forEach((dir) => {
                    const baseTy = currentTransform[dir].ty;
                    const originalHeight = originalBoxes[dir].height;
                    const baseHeight = currentBoxes[dir].height;

                    setTransform(dir, 'sy', (baseHeight + dy / currentScale) / originalHeight);
                    setTransform(dir, 'ty', baseTy + dy / currentScale / 2);
                });

                const bottomGroup = ['sw', 's', 'se'];
                bottomGroup.forEach((dir) => {
                    const baseTy = currentTransform[dir].ty;
                    setTransform(dir, 'ty', baseTy + dy / currentScale);
                });
            }

            // 等比缩放时，更改九宫格父级 scale 参数
            else if (dir.length === 2) {
                const currentWidth = currentBoxes.container.width;
                const scale = (currentWidth + dx) / (currentWidth / currentTransform.scale);
                setScale(scale);
            }
        },

        serializeXML(xml) {
            let str = '';

            if (window.XMLSerializer) {
                str = new XMLSerializer().serializeToString(xml);
            } else {
                str = xml.xml;
            }

            // 存在 <-- xml ..... --> 声明或注释时，会导致 vue 模板解析异常
            const index = str.replace(/<\s*svg/i, '<svg').indexOf('<svg');
            return str.slice(Math.max(0, index));
        },

        render() {
            this.load()
                .then((xml) => {
                    this.buildSvg(xml);
                })
                .catch((err) => {
                    this.errorMessage = err.message;
                })
                .then(() => this.checkLoad())
                .then(() => initMaskInfo(this.model, this.editor));
        },
    },
    events: {
        'group.contentScale'(model, ratio) {
            const parentModel = this.$parent.model;
            if (parentModel !== model) {
                return;
            }

            const { width, height } = this.model;
            this.$scaling = true;
            this.resizeInit('se');
            this.setSize({
                dir: 'se',
                dx: width * (ratio - 1),
                dy: height * (ratio - 1),
            });
            this.resizeEnd();

            setTimeout(() => {
                delete this.$scaling;
            }, 0);
        },
        'element.transformStart'(model, data) {
            if (!this.supportTransform) {
                return;
            }

            // 变换仅支持 SVG 元素单独生效，及其作为 group 子元素时生效的情形
            if (
                !(model === this.model) &&
                !(isGroup(model) && model.elements.indexOf(this.model) > -1)
            ) {
                return;
            }

            const { container, n, w } = this.getBBoxes();
            const { scale } = this.model.containerTransform;
            if (!container || !n || !w) {
                return;
            }
            if (data.dir && data.dir.length === 1) {
                this.model.$minWidth = container.width - n.width * scale;
                this.model.$minHeight = container.height - w.height * scale;
            } else if (data.dir && data.dir.length === 2) {
                // 最小宽度 10，避免选不中
                this.model.$minWidth = 10;
                this.model.$minHeight = this.model.$minWidth * (container.height / container.width);
            }

            this.resizeInit(data.dir);
        },
        'element.transformResize'(drag) {
            this.setSize(drag);
        },
        'element.transformEnd'() {
            this.resizeEnd();
            delete this.model.$minWidth;
            delete this.model.$minHeight;
        },
    },
    watch: {
        'model.content'() {
            this.checkLoad().then(() => {
                this.render();
            });
        },
        'model.url'() {
            this.checkLoad().then(() => {
                this.render();
            });
        },
        // 当外部设入 model.width = newWidth 时更新变换
        'model.width'(width, prevWidth) {
            // 过滤 editor transform 与 scale 过程中的 mutation
            if (!this.supportTransform || this.$svgResizeMeta || this.$scaling || !this.isDesign) {
                return;
            }

            this.resizeInit('e');
            this.setSize({
                dir: 'e',
                dx: width - prevWidth,
                dy: 0,
            });
            this.resizeEnd();
        },
        // 当外部设入 model.height = newHeight 时更新变换
        'model.height'(height, prevHeight) {
            if (!this.supportTransform || this.$svgResizeMeta || this.$scaling || !this.isDesign) {
                return;
            }

            this.resizeInit('s');
            this.setSize({
                dir: 's',
                dx: 0,
                dy: height - prevHeight,
            });
            this.resizeEnd();
        },
    },
    mounted() {
        this.render();
        this.$watch(
            () => this.model.$renderProps,
            () => debounceUpdateMaskInfo(this.model, this.editor),
            { deep: true },
        );
    },
});
