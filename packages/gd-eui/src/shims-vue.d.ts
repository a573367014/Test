declare module '*.vue' {
    import Vue from 'vue';

    const component: DefineComponent<{}, {}, any>;
    export default Vue;
}

declare module '@gaoding/gd-antd*';
