const DEBUG = false;
/**
 * 设置 flex dom 容器的样式
 * @param { Element } flexModel - flex 元素
 * @param { HTMLElement } element - dom 元素
 */
function setFlexStyleToElement(flexModel, element) {
    const {
        autoAdaptive,
        flexDirection,
        justifyContent,
        alignItems,
        alignContent,
        flexWrap,
        width,
        height,
        padding,
    } = flexModel;
    const style = element.style;
    style.position = 'absolute';
    style.visibility = DEBUG ? '' : 'hidden';
    style.pointerEvents = 'none';
    style.left = 0;
    style.top = 0;
    style.zIndex = -100;
    style.display = autoAdaptive === 0 ? 'flex' : 'inline-flex';
    style.width = autoAdaptive & 0b10 ? '' : `${width}px`;
    style.height = autoAdaptive & 0b01 ? '' : `${height}px`;
    style.flexDirection = flexDirection;
    style.justifyContent = justifyContent;
    style.alignItems = alignItems;
    style.alignContent = alignContent;
    style.flexWrap = flexWrap;
    style.padding = padding.map((padding) => `${padding}px`).join(' ');
    style.boxSizing = 'border-box';
}

/**
 * 设置 flex dom 容器的样式
 * @param { Element } nodeModel - node 元素
 * @param { HTMLElement } element - dom 元素
 */
function setNodeStyleToElement(nodeModel, element) {
    const { width, height, type, alignSelf, flexGrow, flexShrink, flexBasis, margin, hidden } =
        nodeModel;
    const style = element.style;
    style.width = `${width}px`;
    style.height = `${height}px`;
    style.alignSelf = alignSelf;
    style.flexGrow = flexGrow;
    style.flexShrink = type === 'text' ? 1 : flexShrink;
    style.flexBasis = flexBasis < 0 ? 'auto' : flexBasis;
    style.margin = margin ? margin.map((margin) => `${margin}px`).join(' ') : '';
    style.display = hidden ? 'none' : '';

    if (DEBUG) {
        style.background = 'green';
    }
}

export class FlexShadow {
    /**
     * @param { HTMLElement } container - 承载 shadow 组件的 dom 容器
     */
    constructor(container) {
        /**
         * @type { Map<String, HTMLElement>}
         */
        this.map = new Map();
        this.container = container;
        this.root = document.createElement('div');
        container.appendChild(this.root);
    }

    destory() {
        this.map = null;
        this.container = null;
        this.root = null;
    }

    /**
     * 设置根节点
     * @param { Element } model - 根结点
     */
    setRoot(model) {
        setFlexStyleToElement(model, this.root);
    }

    /**
     * 设置子节点
     * @param { Array<Element> } models - 子节点数组
     */
    setNodes(models) {
        const ids = {};
        models.forEach((model) => {
            const { $id } = model;
            if (!this.map.has($id)) {
                const element = document.createElement('div');
                this.root.appendChild(element);
                this.map.set($id, element);
            }
            const domElement = this.map.get($id);
            ids[$id] = true;
            setNodeStyleToElement(model, domElement);
        });

        Array.from(this.map.keys()).forEach((key) => {
            if (!ids[key]) {
                const element = this.map.get(key);
                element.remove();
                this.map.delete(key);
            }
        });
    }

    getRootSize() {
        const { offsetWidth, offsetHeight } = this.root;
        return {
            width: offsetWidth,
            height: offsetHeight,
        };
    }

    getNodeSize(id) {
        const element = this.map.get(id);
        if (!element) {
            throw new Error('flex shadow element is not exist!');
        }

        const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = element;
        return {
            left: offsetLeft,
            top: offsetTop,
            width: offsetWidth,
            height: offsetHeight,
        };
    }
}
