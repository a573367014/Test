<template>
    <div>
        <PopupBody
            v-for="(popup) in popups"
            :ref="popup.id"
            :key="popup.id"
            :options="popup" />
    </div>
</template>

<script>
import Vue from 'vue';
import PopupBody from './popup-body.vue';
import { counter } from './counter';

export default {
    components: {
        PopupBody
    },
    data() {
        return {
            popupMap: new Map(),
            tracker: 0
        };
    },
    computed: {
        popups() {
            const { popupMap, tracker } = this;
            return tracker && Array.from(popupMap.values());
        }
    },
    methods: {
        addContent(onUpdate) {
            const id = counter.get();
            this.popupMap.set(id, Vue.observable({
                id: id,
                content: null,
                classes: [],
                tag: 'div',
                left: null,
                top: null,
                right: null,
                bottom: null,
                forceWidth: null,
                width: 0,
                height: 0,
                updateFunc: onUpdate,
                disabled: false
            }));
            this.tracker += 1;

            return id;
        },
        getPopup(id) {
            const popup = this.popupMap.get(id);

            return popup;
        },
        removeContent(id) {
            this.popupMap.delete(id);
            this.tracker += 1;
            // this.$delete(this.popups, id);
        },

        setContent({ id, content, classes, tag, disabled }) {
            const popup = this.getPopup(id);
            if(!popup) return;
            if(content) {
                popup.content = content;
            }

            if(classes) {
                popup.classes = classes;
            }

            if(tag) {
                popup.tag = tag;
            }

            popup.disabled = disabled;

            this.$nextTick(() => {
                if(this.$refs[id][0]) {
                    this.$refs[id][0].onUpdate();
                }
            });
            // this.onUpdate();
        },

        /**
         * 设置弹出位置
         * @param {{left: number, top: number, right: number, bottom: number, forceWidth: number, id: string, width: number, height: number}} position
         */
        setPosition(position) {
            const popup = this.getPopup(position.id);
            if(!popup) return;
            ['left', 'top', 'right', 'bottom'].forEach(key => {
                if(typeof position[key] === 'number') {
                    popup[key] = position[key];
                }
                else {
                    popup[key] = null;
                }
            });

            if(typeof position.forceWidth === 'number') {
                popup.forceWidth = position.forceWidth;
            }

            popup.width = position.width;
            popup.height = position.height;

            this.$nextTick(() => {
                if(this.$refs[position.id][0]) {
                    this.$refs[position.id][0].onUpdate();
                }
            });
        },

        disablePopup(id, disabled) {
            const popup = this.getPopup(id);
            if(!popup) return;
            popup.disabled = disabled;
        },

        getContentSize(id) {
            const popupEl = this.$refs[id];
            if(popupEl && popupEl[0]) {
                return {
                    width: popupEl[0].elWidth,
                    height: popupEl[0].elHeight
                };
            }
            return { width: 0, height: 0 };
        }
    }
};
</script>
