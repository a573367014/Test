import inherit from '../../utils/vue-inherit';
import loader from '@gaoding/editor-utils/loader';

import BaseElement from '../../base/base-element';
import template from './common-element.html';
import { get } from 'lodash';
import { i18n } from '../../i18n';

export default inherit(BaseElement, {
    name: 'common-element',
    props: ['global', 'model', 'editor'],
    template,
    data() {
        return {
            visible: false,
        };
    },
    computed: {
        iconStyle() {
            const zoom = this.global.zoom;
            const { width } = this.model;
            const realWidth = width * zoom;
            if (realWidth < 160) {
                return {
                    width: '22px',
                    height: '16px',
                    backgroundSize: '22px',
                    marginBottom: this.errorText ? '12px' : '0px',
                };
            }

            return {
                marginBottom: this.errorText ? '12px' : '0px',
            };
        },
        errorText() {
            const zoom = this.global.zoom;
            const { width } = this.model;
            const realWidth = width * zoom;
            if (realWidth > 250) {
                return i18n.$tsl('不支持该元素');
            } else {
                return '';
            }
        },
        cssStyle() {
            const { rect } = this;
            const { padding } = rect;

            return {
                height: rect.height + padding[0] + padding[2] + 'px',
                width: rect.width + padding[1] + padding[3] + 'px',
                transform: this.transform.toString(),
                left: rect.left + 'px',
                top: rect.top + 'px',
                opacity: this.opacity,
                background: this.model.imageUrl ? '' : '#F8FAFC',
            };
        },
        imageStyle() {
            const rect = this.rect;

            return {
                height: rect.height + 'px',
                width: rect.width + 'px',
                display: 'block',
            };
        },
        effectedImageRect() {
            const { model, global } = this;

            return get(model, 'effectedResult.width')
                ? {
                      width: model.effectedResult.width * global.zoom + 'px',
                      height: model.effectedResult.height * global.zoom + 'px',
                      left: model.effectedResult.left * global.zoom + 'px',
                      top: model.effectedResult.top * global.zoom + 'px',
                      position: 'absolute',
                  }
                : this.imageStyle;
        },
    },
    methods: {
        async load() {
            return this.model.imageUrl && loader.loadImage(this.model.imageUrl);
        },
    },
    created() {
        this.editor
            .createAsyncComponent(this.model)
            .then((res) => {
                if (!res) this.visible = true;
            })
            .catch(() => {
                this.visible = true;
            });
    },
});
