import throttle from 'lodash/throttle';
import template from './ui-contextmenu.html';

export const MENU_CLASSNAME = 'editor-contextmenu';
export const SUBMENU_CLASSNAME = `${MENU_CLASSNAME}--submenu`;
export const MENUITEM_CLASSNAME = `${MENU_CLASSNAME}__item`;
export const DELIMITER_CLASSNAME = `${MENU_CLASSNAME}__delimiter`;

const IS_MAC = navigator.platform.includes('Mac');

export default {
    name: 'ui-contextmenu',
    template,

    props: {
        isSubmenu: {
            type: Boolean,
            default: false,
        },
        menuData: {
            type: Array,
            default: () => [],
        },
        x: {
            type: Number,
            defult: 0,
        },
        y: {
            type: Number,
            default: 0,
        },
        show: {
            type: Boolean,
            default: false,
        },
    },

    watch: {
        isShow(value) {
            this.$nextTick(() => {
                if (value) {
                    this.$el.focus();
                } else {
                    this.closeSubmenu(this.$el);
                }
            });
        },
    },

    mounted() {
        document.body.addEventListener('click', this.closeMenu);
        document.body.addEventListener('contextmenu', this.closeMenu);
    },

    beforeDestroy() {
        document.body.removeEventListener('click', this.closeMenu);
        document.body.removeEventListener('contextmenu', this.closeMenu);
    },
    computed: {
        menuStyle() {
            if (this.isSubmenu) return {};
            return {
                visibility: this.isShow ? 'visible' : 'hidden',
                left: `${this.x}px`,
                top: `${this.y}px`,
            };
        },
        isShow: {
            get() {
                return this.show;
            },
            set(value) {
                this.$emit('update:show', value);
            },
        },
    },

    methods: {
        wrapAction(item) {
            const hasPopup = !!(item.data || item.slot);
            return hasPopup
                ? this.openSubmenu
                : (event) => {
                      event.stopPropagation();
                      item.action && item.action();
                      this.isShow = false;
                  };
        },
        mousemove: throttle(function mousemove({ target }) {
            const focusableEl = target.closest('[tabindex]');
            if (focusableEl !== document.activeElement) {
                this.closeSubmenu(focusableEl.parentElement);
                focusableEl.focus();

                if (this.hasSubmenu(focusableEl)) {
                    focusableEl.setAttribute('aria-expanded', true);
                }
            }
        }, 100),

        mouseleave() {
            this.$el.focus();
        },

        navigateItem(event) {
            event.stopPropagation();
            event.preventDefault();

            const { keyCode } = event;
            const { activeElement } = document;

            // esc键关闭菜单
            if (keyCode === 27) {
                this.isShow = false;
                // 回车键或空格键执行菜单项
            } else if ([13, 32].some((n) => n === keyCode)) {
                activeElement.click();
                // 右箭头打开子菜单
            } else if (keyCode === 39 && this.hasSubmenu(activeElement)) {
                this.openSubmenu();
                // 左箭头关闭子菜单
            } else if (keyCode === 37 && this.isSubmenu(activeElement)) {
                const parentItem = activeElement.parentElement.parentElement;
                parentItem.focus();
                parentItem.setAttribute('aria-expanded', false);
                // 上下箭头循环菜单项
            } else if ([38, 40].some((n) => n === keyCode)) {
                const isFocusOnMenu = activeElement.classList.contains(MENU_CLASSNAME);
                const menu = isFocusOnMenu ? activeElement : activeElement.parentElement;
                const focusableItems = [...menu.children].filter(
                    (item) => item.hasAttribute('tabindex') && !item.hasAttribute('aria-disabled'),
                );

                const { length } = focusableItems;
                if (length > 1) {
                    const activeIndex = focusableItems.indexOf(activeElement);
                    const offset = keyCode === 38 ? -1 : 1;
                    const index = Math.max(activeIndex + offset, -1);
                    const nextIndex = ((index % length) + length) % length;
                    const nextItem = focusableItems[nextIndex];
                    nextItem.focus();
                    this.closeSubmenu(menu);
                }
            }
        },

        hasSubmenu(el) {
            return el.hasAttribute('aria-haspopup');
        },

        openSubmenu() {
            const { activeElement } = document;
            activeElement.setAttribute('aria-expanded', true);
            activeElement.querySelector(`.${MENUITEM_CLASSNAME}`)?.focus();
        },

        closeSubmenu(menu) {
            const expanded = menu.querySelector('[aria-expanded="true"]');
            if (expanded) {
                expanded.setAttribute('aria-expanded', false);
            }
        },

        formatShortcut(value) {
            const keyRepresents = IS_MAC
                ? {
                      meta: '⌘',
                      shift: '⇧',
                  }
                : {
                      meta: 'Ctrl',
                      shift: 'Shift',
                  };
            return value
                .replace(/command|⌘|ctrl/i, keyRepresents.meta)
                .replace(/shift|⇧/i, keyRepresents.shift);
        },

        closeMenu(event) {
            if (!this.$el.contains(event.target)) {
                this.isShow = false;
            }
        },
    },
};
