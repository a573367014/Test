import Vue from 'vue';
import Framework from '@gaoding/editor-framework/src/index';
import elements from '@gaoding/editor-elements/lazy';
import models from '@gaoding/editor-elements/model';
import { WebsocketProvider } from 'y-websocket';

// @ts-ignore
import fontList from './resources/font-list.json';
import '@gaoding/editor-framework/src/styles/index.less';

const framework = new Framework();
framework.models = models;
framework.asyncElementsMap = elements;

const base = 'cy' in window ? '/__cypress/src/' : '/';

export default {
    name: 'demoMain',
    render: function (h) {
        const createEditorElement = (i: number) => {
            return h('div', { class: 'editor-wrapper' }, [
                h('editor', {
                    props: {
                        editorOptions: this.editorOptions,
                    },
                    ref: `editor${i}`,
                }),
            ]);
        };
        const { count } = this;

        return h('div', { class: 'editors' }, [[...Array(count).keys()].map(createEditorElement)]);
    },
    computed: {
        defaultEditor() {
            return this.$refs.editor0;
        },
    },
    components: {
        editor: framework.createEditor(Vue),
    },
    data() {
        return {
            // 可在控制台 app.count 设置 VPE 实例数量
            count: 1,
            editorOptions: {
                fontList,
                picaResizeEnable: true
            },
        };
    },
    async mounted() {
        const params = new URL(window.location.href).searchParams;
        const syncRemote = !!params.get('sync_remote');

        // 不加载本地模板，同步远程 Yjs - http://localhost:3000?sync_remote=1
        // 获取远程模板 - 控制台 yAdapter._debugReload()

        if (syncRemote) {
            const { doc } = this.defaultEditor.$binding;
            const provider = new WebsocketProvider('ws://localhost:1234', 'vpe-room', doc);
        } else {
            const templet = await fetch(base + 'resources/poster.json').then((resp) => resp.json());
            await this.defaultEditor.setTemplet(templet);
        }

        // @ts-ignore
        window.app = this;
    },
};
