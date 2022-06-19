import Vue from 'vue';
import { get } from 'lodash';
import createComponent from '../base/create-component';

import maskEditor from './mask-editor';
import template from './background-editor.html';

export default {
    props: ['layout', 'global', 'options'],
    name: 'background-editor',
    template,
    components: {
        backgroundInnerEditor: createComponent(Vue, maskEditor),
    },
    computed: {
        editor() {
            return this.$parent;
        },

        inpaintUrl() {
            return get(this.layout, 'metaInfo.thirdParty.inpaint.url');
        },
    },

    data() {
        return {
            model: null,
        };
    },

    created() {
        this.model = this.editor.createElement({
            ...this.layout.background.image,
            resize: 0,
            url:
                this.layout.backgroundEffectImage ||
                this.inpaintUrl ||
                this.layout.background.image.url,
            type: 'image',
            $originalUrl: this.layout.background.image.url,
        });
        this.model.type = 'background-croper';
        this.model.$naturalImageWidth = this.model.$imageWidth;
        this.model.$naturalImageHeight = this.model.$imageHeight;
    },

    methods: {
        getBoundingClientRect() {
            return this.$refs.innerEditor.$el.getBoundingClientRect();
        },
    },

    beforeDestroy() {
        this.editor.hideBackgrounCroper(this.layout);

        if (this.editor.currentElement === this.model) {
            this.editor.focusElement(null);
        }
    },
};
