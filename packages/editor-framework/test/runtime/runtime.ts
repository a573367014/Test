import * as Y from '@gaoding/yjs';
import Vue from 'vue';
import { mount as mountVue } from '@cypress/vue';
import Framework from '../../src/index';
import elements from '@gaoding/editor-elements/lazy';
import models from '@gaoding/editor-elements/model';
import type { ILayoutModel, ElementModel, IVPEditor } from '../../src/types/editor';
import { EditorDriver } from './driver';
import fontList from '../resources/font-list.json';
import { IS_CYPRESS } from './consts';

import '../../src/styles/index.less';
import './style.css';

const framework = new Framework();
framework.models = models;
framework.asyncElementsMap = elements;

// assert 方法封装可减少重复的 Cypress DOM Snapshot
// TODO 支持无 cypress 环境下运行
export const assert = {
    ok: chai.assert.ok,
    fail: chai.assert.fail,
    equal: chai.assert.equal,
    notEqual: chai.assert.notEqual,
    deepEqual: chai.assert.deepEqual,
    almostEqual(actual: number, expected: number, threshold?: number) {
        return chai.expect(actual).closeTo(expected, threshold || 0.1);
    },
    sizeEqual: (
        actual: ElementModel | ILayoutModel,
        expectedWidth: number,
        expectedHeight: number,
    ) => {
        chai.assert.deepEqual(
            [actual.width, actual.height],
            [expectedWidth, expectedHeight],
            'width height 尺寸匹配',
        );
    },
    leftTopEqual: (actual: ElementModel, expectedLeft: number, expectedTop: number) => {
        chai.assert.deepEqual(
            [actual.left, actual.top],
            [expectedLeft, expectedTop],
            'left top 定位匹配',
        );
    },
    rectEqual: (
        actual: ElementModel,
        expectedLeft: number,
        expectedTop: number,
        expectedWidth: number,
        expectedHeight: number,
    ) => {
        chai.assert.deepEqual(
            [actual.left, actual.top, actual.width, actual.height],
            [expectedLeft, expectedTop, expectedWidth, expectedHeight],
            'rect 状态匹配',
        );
    },
};

// TODO 支持无 cypress 环境下运行
export function it(name: string, callback: Function) {
    if (IS_CYPRESS) {
        window.it(name, () => callback());
    }
}
it.skip = function (...args: any[]) {
    if (IS_CYPRESS) {
        window.it.skip(args[0]);
    }
};

it.only = function (...args: any[]) {
    if (IS_CYPRESS) {
        window.it.only(args[0], args[1]);
    }
};

// TODO 支持无 cypress 环境下运行
export function describe(name: string, callback: Function) {
    if (IS_CYPRESS) {
        window.describe(name, () => {
            before(() => {
                console.clear();
            });
            callback();
        });
    }
}
describe.skip = function (...args: any[]) {
    if (IS_CYPRESS) {
        console.clear();
        window.describe.skip(args[0], args[1]);
    }
};
describe.only = function (...args: any[]) {
    if (IS_CYPRESS) {
        console.clear();
        window.describe.only(args[0], args[1]);
    }
};

const EditorWrapper = Vue.extend({
    name: 'EditorWrapper',
    computed: {
        editor() {
            return this.$refs.editor;
        },
    },
    template: `
    <div class="editor-wrapper">
        <editor :editor-options="editorOptions" ref="editor"/>
    </div>
    `,
    components: {
        editor: framework.createEditor(Vue),
    },
    data() {
        return {
            editorOptions: { fontList },
        };
    },
    mounted() {
        // @ts-ignore
        window.app = this;
        // @ts-ignore
        window.editor = this.editor;
    },
});

const EditorCollabWrapper = Vue.extend({
    name: 'EditorCollabWrapper',
    computed: {
        editorA() {
            return this.$refs.editorA;
        },
        editorB() {
            return this.$refs.editorB;
        },
    },
    template: `
    <div class="editors">
        <div class="editor-wrapper-collab">
            <editor :editor-options="editorOptions" ref="editorA"/>
        </div>
        <div class="editor-wrapper-collab">
            <editor :editor-options="editorOptions" ref="editorB"/>
        </div>
    </div>
    `,
    components: {
        editor: framework.createEditor(Vue),
    },
    data() {
        return {
            editorOptions: { fontList },
        };
    },
    mounted() {
        // @ts-ignore
        window.app = this;
        // @ts-ignore
        window.editorA = this.editorA;
        // @ts-ignore
        window.editorB = this.editorB;
    },
});

interface CypressVMWrapper extends Vue {
    editor: IVPEditor;
}

interface CypressVMCollabWrapper extends Vue {
    editorA: IVPEditor;
    editorB: IVPEditor;
}

export function mountDriver(): Promise<EditorDriver> {
    return new Promise<EditorDriver>((resolve) => {
        mountVue(EditorWrapper).then(() => {
            const vm = Cypress.vueWrapper.vm as CypressVMWrapper;
            const driver = new EditorDriver([vm.editor]);
            resolve(driver);
        });
    });
}

interface CollabMountResult {
    driver: EditorDriver;
    editorA: IVPEditor;
    editorB: IVPEditor;
}

export function mountCollabDriver(): Promise<CollabMountResult> {
    return new Promise<CollabMountResult>((resolve) => {
        mountVue(EditorCollabWrapper).then(() => {
            const vm = Cypress.vueWrapper.vm as CypressVMCollabWrapper;
            const { editorA, editorB } = vm;
            const docA = editorA.$binding.doc;
            const docB = editorB.$binding.doc;

            docA.on('update', (update: Uint8Array) => {
                Y.applyUpdate(docB, update);
            });
            docB.on('update', (update: Uint8Array) => {
                Y.applyUpdate(docA, update);
            });

            const driver = new EditorDriver([vm.editorA, vm.editorB]);
            resolve({ driver, editorA, editorB });
        });
    });
}
