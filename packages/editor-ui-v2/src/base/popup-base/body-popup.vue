<style lang="less"></style>

<script>
import { createPopup } from './create-popup';
import { directionList, alignList } from './popup-props';

/**
 * 获取元素的样式
 * @param { HTMLElement } element - 目标元素
 * @param { string } styleName - 样式名称
 * @returns { string | undefined }
 */
function _getComputedStyle(element, styleName) {
    const styles = window.getComputedStyle(element, null);
    return styles[styleName];
}

/**
 * 判断是否包含有目标样式
 * @param { string } style - 样式内容
 * @param { Array<string> } targetStyles - 包含的目标样式列表
 */
function someContainStyle(style, targetStyles) {
    return targetStyles.some((targetStyle) => {
        return style.indexOf(targetStyle) >= 0;
    });
}

/**
 * 从传入的元素向上查找到可以滚动的元素
 * @param { HTMLElement } element - 查找的元素
 * @returns { HTMLElement } 查找到的可以滚动的元素或 body
 */
function getScrollParentsFromDOM(element, scrollParents = []) {
    const parent = element.parentNode;
    if (!parent) {
        return scrollParents;
    }

    if (parent === document) {
        // Firefox puts the scrollTOp value on `documentElement` instead of `body`, we then check which of them is
        // greater than 0 and return the proper element
        if (document.body.scrollTop || document.body.scrollLeft) {
            return scrollParents.concat(document.body);
        } else {
            return scrollParents.concat(window);
        }
    }
    const scorllStyles = ['scroll', 'auto'];
    if (
        someContainStyle(_getComputedStyle(parent, 'overflow'), scorllStyles) ||
        someContainStyle(_getComputedStyle(parent, 'overflow-x'), scorllStyles) ||
        someContainStyle(_getComputedStyle(parent, 'overflow-y'), scorllStyles)
    ) {
        return getScrollParentsFromDOM(parent, scrollParents.concat(parent));
    }
    return getScrollParentsFromDOM(parent, scrollParents);
}

/**
 * 从传入的实例向上查找到可以 popup 并返回它的 scrollParent
 * @param { Vue } element - 查找的实例
 * @returns { HTMLElement } 查找到的可以滚动的元素或 null
 */
function registerParentPopup(vm) {
    let parent = vm.$el.parentNode;
    while (parent && parent !== document) {
        if (parent.__vue__) {
            const popup = popups[parent.__vue__.popupId];
            if (popup && popup.popupId !== vm.popupId) {
                popup.childrens.push(vm.popupId);
                vm.parent = popup.popupId;
                break;
            }
        }
        parent = parent.parentNode;
    }
}

function unregisterParentPopup(vm) {
    const { parent, popupId } = vm;
    if (!parent) {
        return;
    }

    const popup = popups[parent];
    const index = popup.childrens.indexOf(popupId);
    popup.childrens.splice(index, 1);
}

function unregisterChildrens(vm) {
    const { childrens } = vm;
    childrens.forEach((popupId) => {
        const popup = popups[popupId];
        popup.parent = null;
    });
    vm.childrens = [];
}

function getFirstComponentChild(children) {
    if (children) {
        for (let i = 0; i < children.length; i++) {
            if (children[i] && (children[i].tag || children[i].text)) {
                return children[i];
            }
        }
    }
}

function objectIsElement(obj) {
    try {
        return obj instanceof HTMLElement;
    } catch (e) {
        return (
            typeof obj === 'object' &&
            obj.nodeType === 1 &&
            typeof obj.style === 'object' &&
            typeof obj.ownerDocument === 'object'
        );
    }
}

const popups = {};

export default {
    props: {
        placement: {
            type: String,
            default: () => 'bottom-start',
            validator: function (value) {
                const placements = value.split('-');
                return directionList.includes(placements[0]) && alignList.includes(placements[1]);
            },
        },
        boundariesPadding: {
            type: Number,
            default: () => 5,
        },
        tag: {
            type: String,
            default: () => 'div',
        },
        classes: {
            type: [Object, Array, String],
            default: () => ({}),
        },
        forcePlacement: {
            type: Boolean,
            default: () => false,
        },
        allowDirections: {
            type: Array,
            default: () => directionList,
        },
        // allowAligns: {
        //     type: Array,
        //     default: () => alignList
        // },
        asRefWidth: {
            type: Boolean,
            default: () => false,
        },
        reference: {
            type: [Object, String],
            default: () => null,
        },
        width: {
            type: Number,
            default: 0,
        },
        height: {
            type: Number,
            default: 0,
        },
        disabled: {
            type: Boolean,
            default: false,
        },
        position: {
            type: Object,
            default: () => {},
        },
    },
    data() {
        return {
            popupId: '',
            parent: null,
            childrens: [],
            popupApp: null,
        };
    },
    computed: {
        referenceElement() {
            const { reference } = this;

            if (!reference) {
                const firstChild = getFirstComponentChild(this.$slots.default);
                return firstChild && firstChild.elm;
            }

            let element = null;
            if (typeof reference === 'string') {
                element = document.querySelector(reference);
            } else if (reference.el) {
                element = reference.el;
            } else if (reference.elm) {
                element = reference.elm;
            } else if (objectIsElement(reference)) {
                element = reference;
            }

            if (!element) {
                throw new Error('reference not found');
            }

            return element;
        },
    },
    watch: {
        reference(newValue) {
            if (newValue) {
                this.updatePosition();
            }
        },
        disabled() {
            this.popupApp.disablePopup(this.popupId, this.disabled);
        },
    },
    created() {
        this.popupApp = createPopup({ parent: this.$parent });
        this.createPopup();
        popups[this.popupId] = this;
    },
    mounted() {
        this.$nextTick(() => {
            registerParentPopup(this);
            this.updatePopup();
            this.scrollParents = [...getScrollParentsFromDOM(this.$el)];
            this.scrollParents.forEach((parent) => {
                parent.removeEventListener('scroll', this.updatePosition);
                parent.addEventListener('scroll', this.updatePosition);
            });
            window.addEventListener('resize', this.onWindowResize);
        });
    },
    beforeDestroy() {
        unregisterParentPopup(this);
        unregisterChildrens(this);
        popups[this.popupId] = null;
        if (this.scrollParents) {
            this.scrollParents.forEach((parent) => {
                parent.removeEventListener('scroll', this.updatePosition);
            });
        }
        window.removeEventListener('resize', this.onWindowResize);
        this.destroyPopup();
    },

    methods: {
        onWindowResize() {
            this.updatePosition();
        },
        updatePosition() {
            const { asRefWidth, popupApp, popupId, referenceElement } = this;
            if (!referenceElement) {
                return;
            }

            const referenceRect = this.referenceElement.getBoundingClientRect();

            let { width, height } = popupApp.getContentSize(popupId);
            if (asRefWidth) {
                width = referenceRect.width;
            }
            const { placement } = this;
            if (width === 0 || height === 0) {
                return;
            }

            width = this.width ? this.width : width;
            height = this.height ? this.height : height;

            const placements = placement.split('-');
            const direction = placements[0] || 'top';
            const align = placements[1] || 'center';

            const directionData = this.setDirection(direction, referenceRect, width, height);
            const alignData = this.setAlign(
                align,
                directionData.direction,
                referenceRect,
                width,
                height,
                align,
            );
            directionData[alignData.placement] = alignData.position;

            this.$emit('update:placement', `${directionData.direction}-${alignData.align}`);
            popupApp.setPosition({
                id: popupId,
                left: directionData.left && directionData.left + (this.position?.left || 0),
                top: directionData.top && directionData.top + (this.position?.top || 0),
                right: directionData.right && directionData.right + (this.position?.right || 0),
                bottom: directionData.bottom && directionData.bottom + (this.position?.bottom || 0),
                forceWidth: asRefWidth ? referenceRect.width : -1,
                width: this.width,
                height: this.height,
            });
            this.childrens.forEach((children) => {
                const popup = popups[children];
                popup.updatePosition();
            });
        },

        getPopupChildrens() {
            return this.$scopedSlots.popup ? this.$scopedSlots.popup() : this.$slots.popup || [];
        },

        createPopup() {
            const popupApp = this.popupApp;
            this.popupId = popupApp.addContent(this.updatePosition);

            this.updatePopup();
        },

        updatePopup() {
            const { popupId, tag, classes, popupApp, disabled } = this;
            const slots = this.getPopupChildrens();
            popupApp.setContent({
                id: popupId,
                content: slots,
                tag: tag,
                classes: classes,
                disabled,
            });
        },

        destroyPopup() {
            this.popupApp.removeContent(this.popupId);
        },

        notInScreen(position, size, maxSize) {
            return position < 0 || position + size > maxSize;
        },

        /**
         * 计算显示方向,如果结果超出屏幕则重新计算
         * @param { 'top' | 'bottom' | 'left' | 'right' } direction - 显示方向
         * @param { ClientRect } referenceRect - 参考元素 Rect
         * @param { number } width - 元素宽度
         * @param { number } height - 元素高度
         * @param { number } retryTime - 重试次数
         * @returns { { left: number, top: number, right: number, bottom: number, direction: 'top' | 'bottom' | 'left' | 'right' } }
         */
        setDirection(direction, referenceRect, width, height, retryTime = 0) {
            const {
                left: referenceLeft,
                top: referenceTop,
                right: referenceRight,
                bottom: referenceBottom,
                height: referenceHeight,
                width: referenceWidth,
            } = referenceRect;
            const { boundariesPadding, forcePlacement, allowDirections } = this;
            const { innerWidth, innerHeight } = window;
            const index = (allowDirections.indexOf(direction) + 1) % allowDirections.length;

            let top = null;
            let left = null;
            let right = null;
            let bottom = null;
            const isHorizontal = false;
            switch (direction) {
                case 'bottom':
                    top = referenceTop + referenceHeight + boundariesPadding;
                    if (
                        !forcePlacement &&
                        retryTime < allowDirections.length &&
                        this.notInScreen(top, height, innerHeight)
                    ) {
                        return this.setDirection(
                            allowDirections[index],
                            referenceRect,
                            width,
                            height,
                            retryTime + 1,
                        );
                    }
                    break;
                case 'top':
                    bottom = innerHeight - referenceBottom + referenceHeight + boundariesPadding;
                    if (
                        !forcePlacement &&
                        retryTime < allowDirections.length &&
                        this.notInScreen(bottom, height, innerHeight)
                    ) {
                        return this.setDirection(
                            allowDirections[index],
                            referenceRect,
                            width,
                            height,
                            retryTime + 1,
                        );
                    }
                    break;
                case 'left':
                    right = innerWidth - referenceRight + referenceWidth + boundariesPadding;
                    if (
                        !forcePlacement &&
                        retryTime < allowDirections.length &&
                        this.notInScreen(right, width, innerWidth)
                    ) {
                        return this.setDirection(
                            allowDirections[index],
                            referenceRect,
                            width,
                            height,
                            retryTime + 1,
                        );
                    }
                    break;
                case 'right':
                    left = referenceLeft + referenceWidth + boundariesPadding;
                    if (
                        !forcePlacement &&
                        retryTime < allowDirections.length &&
                        this.notInScreen(left, width, innerWidth)
                    ) {
                        return this.setDirection(
                            allowDirections[index],
                            referenceRect,
                            width,
                            height,
                            retryTime + 1,
                        );
                    }
                    break;
            }

            return { left, top, right, bottom, direction, isHorizontal };
        },

        /**
         * 计算对其位置，如果结果超出屏幕则重新计算
         * @param { 'start' | 'center' | 'end' } align - 对其位置
         * @param { 'top' | 'bottom' | 'left' | 'right' } direction - 显示方向
         * @param { ClientRect } referenceRect - 参考元素 Rect
         * @param { number } width - 元素宽度
         * @param { number } height - 元素高度
         * @returns { { position: number, align: 'start' | 'center' | 'end', placement: 'left' | 'top' | 'right' | 'bottom' } }
         */
        setAlign(align, direction, referenceRect, width, height) {
            const {
                left: referenceLeft,
                top: referenceTop,
                right: referenceRight,
                bottom: referenceBottom,
                height: referenceHeight,
                width: referenceWidth,
            } = referenceRect;
            const { forcePlacement } = this;
            let position = -1;
            let size = -1;
            let maxSize = -1;
            let placement = '';
            if (['left', 'right'].includes(direction)) {
                size = height;
                maxSize = window.innerHeight;
                placement = 'top';
                switch (align) {
                    case 'start':
                        position = referenceTop;
                        break;
                    case 'center':
                        position = (referenceTop + referenceHeight + referenceTop - height) / 2;
                        break;
                    case 'end':
                        placement = 'bottom';
                        position = maxSize - referenceBottom;
                }
            } else {
                size = width;
                maxSize = window.innerWidth;
                placement = 'left';
                switch (align) {
                    case 'start':
                        position = referenceLeft;
                        break;
                    case 'center':
                        position = (referenceLeft + referenceWidth + referenceLeft - width) / 2;
                        break;
                    case 'end':
                        placement = 'right';
                        position = maxSize - referenceRight;
                }
            }

            if (!forcePlacement) {
                if (position < 0) {
                    position = 0;
                } else if (position + size > maxSize) {
                    position = maxSize - size;
                }
            }

            return { position: position, align, placement };
        },
    },
    render() {
        const vNode = getFirstComponentChild(this.$slots.default);
        this.updatePopup();
        if (!vNode) {
            return;
        }
        return vNode;
    },
};
</script>
