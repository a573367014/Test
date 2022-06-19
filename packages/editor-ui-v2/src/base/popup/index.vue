<template>
    <PopupBase
        :classes="classNames"
        @update:placement="onChangePlacement"
        v-bind="$attrs"
        ref="popup"
        :append-body="appendBody"
        :disabled="!visible"
        :position="position">
        <slot />
        <div
            slot="popup"
            v-if="cache || visible"
            @mousedown="onMouseDown"
            ref="popupContent">
            <slot name="content"/>
        </div>
    </PopupBase>
</template>


<script>
import PopupBase from '../popup-base/index.vue';

const popups = {};

export default {
    components: {
        PopupBase
    },
    props: {
        visible: {
            type: Boolean,
            default: () => false
        },
        globalClick: {
            type: Boolean,
            default: () => true
        },
        cache: {
            type: Boolean,
            default: () => false
        },
        classNames: {
            type: [Object, Array, String],
            default: () => ({})
        },
        appendBody: {
            type: Boolean,
            default: true
        },
        position: {
            type: Object,
            default: () => {}
        }
    },
    data() {
        return {
            parentId: null,
            childrens: []
        };
    },
    watch: {
        visible: {
            handler: function(value) {
                this.setDocEvent();
                this.$emit(value ? 'active' : 'inactive');
            }
        },
        globalClick: {
            handler: function() {
                this.setDocEvent();
            }
        }
    },
    mounted() {
        const id = this.getPopupId();
        popups[this.getPopupId()] = this;
        let parent = this.$el.parentNode;
        while(parent && parent !== document) {
            // console.log(parent, parent.parentNode);
            if(parent.__vue__) {
                const parentVM = parent.__vue__;
                if(popups[parentVM.popupId]) {
                    const parentPopup = popups[parentVM.popupId];
                    this.parentId = parentVM.popupId;
                    parentPopup.childrens.push(this.getPopupId());
                    break;
                }
            }
            parent = parent.parentNode;
        }
        this.setDocEvent();
    },
    beforeDestroy() {
        this.unBindDocEvent();
        popups[this.getPopupId()] = null;
        if(this.parentId && popups[this.parentId]) {
            const parentPopup = popups[this.parentId];
            parentPopup.childrens = parentPopup.childrens.filter(uid => uid !== this.getPopupId());
        }
        if(this.visible) {
            this.$emit('update:visible', false);
        }
    },
    methods: {
        setDocEvent() {
            const { globalClick, visible } = this;
            if(globalClick && visible) {
                this.bindDocEvent();
            }
            else {
                this.unBindDocEvent();
            }
        },
        updateVisible(value) {
            this.$emit('update:visible', value);
        },
        bindDocEvent() {
            setTimeout(() => {
                document.addEventListener('click', this.onDocClick, true);
            }, 12);
        },
        unBindDocEvent() {
            document.removeEventListener('click', this.onDocClick, true);
        },
        onDocClick(event) {
            if(this.isClickOutPopup(event)) {
                this.updateVisible(false);
            }
            this.mouseDownInPopup = false;
        },
        isClickOutPopup(event) {
            const el = event.target;
            if(this.appendBody) {
                const clickInChildrens = this.childrens.some(uid => {
                    const popup = popups[uid];
                    if(popup) {
                        return !popup.isClickOutPopup(event);
                    }
                    return true;
                });

                const clickInPopup = this.$refs.popupContent && this.$refs.popupContent.contains(el);
                if(!clickInPopup && this.mouseDownInPopup) {
                    // 当在 popup 内按下鼠标之后拖拽到 popup 外松开鼠标，会触发外部的点击事件，将这个情况的事件阻塞掉
                    event.preventDefault();
                    event.stopPropagation();
                }
                const popup = this.getPopup();
                const parentEl = popup && popup.referenceElement;
                const isClickInParent = parentEl && parentEl.contains(el);
                return !clickInPopup && !this.mouseDownInPopup && !isClickInParent && !clickInChildrens;
            }
            else {
                // const parentEl = this.$refs.popup && this.$refs.popup.referenceElement;
                // const isClickInParent = parentEl && parentEl.contains(el);
                // console.log(isClickInParent);
                return !this.$el.contains(el);
            }
        },
        onChangePlacement(placement) {
            this.$emit('update:placement', placement);
        },
        onMouseDown() {
            this.mouseDownInPopup = true;
        },
        getPopupId() {
            const popup = this.getPopup();
            return popup && popup.popupId;
        },
        getPopup() {
            return this.$refs.popup && this.$refs.popup.getPopup && this.$refs.popup.getPopup();
        }
    }
};
</script>
