import resolve from 'rollup-plugin-node-resolve';
import vue from 'rollup-plugin-vue';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-typescript2';
import path from 'path';
import postcss from 'rollup-plugin-postcss';
import { getAllFiles } from './utils';
// import { terser } from 'rollup-plugin-terser';

const getPath = (_path) => path.resolve(__dirname, _path);

const extensions = ['.js', '.ts'];

// ts
const tsPlugin = ts({
    tsconfig: getPath('../tsconfig.json'), // 导入本地ts配置
    extensions,
});

const getChunks = (fileId) => {
    let targetFile = fileId.substring(fileId.lastIndexOf('src/') + 4);
    if (targetFile.indexOf('.vue') !== -1) {
        targetFile = targetFile.substring(0, targetFile.indexOf('.vue'));
    } else {
        targetFile = targetFile.substring(0, targetFile.indexOf('.ts'));
    }
    return targetFile;
};

const manualChunks = (id) => {
    return getChunks(id);
};

const entryFileList = {};

getAllFiles(path.resolve(__dirname, '../src')).filter((file) => {
    if (file.match(/(\.ts)|(\.vue)/) && !file.match(/\.d\.ts/) && !file.match(/\/style\//)) {
        entryFileList[getChunks(file)] = file;
    }
});

/**
 * 将样式引用进各自组件内，组件使用时可无须手动引入样式
 * @returns {import('rollup').Plugin}
 */
const importCssPlugin = () => {
    return {
        resolveId(id, importer) {
            if (
                /src\/components\/(base|container|high-level|modules)\/[\w\d-]+\/index.ts/.test(
                    importer,
                ) &&
                /.\/style\/index.js/.test(id)
            ) {
                return false;
            }
        },
        transform(code, id) {
            if (
                /src\/components\/(base|container|high-level|modules)\/[\w\d-]+\/index.ts/.test(
                    id,
                ) &&
                code.indexOf(`import './style/index.js';`) === -1
            ) {
                return `import './style/index.js';\n` + code;
            }
        },
    };
};

const getBaseRollupConfig = (inputFile) => {
    /**
     * @type {import('rollup').RollupOptions}
     */
    const config = {
        input: inputFile,
        external: [
            /@gaoding\/gd-antd/,
            'lodash',
            'tinycolor2',
            'lodash/throttle',
            'lodash/debounce',
            'vue',
            'vue-demi',
            'mitt',
            'resize-observer-polyfill',
            '@vue/composition-api',
            /src\/components\/(base|container|high-level|modules)\/[\w\d-]+\/style\//,
        ],
        output: [
            {
                name: 'gd-eui',
                format: 'cjs',
                dir: 'lib',
                chunkFileNames: '[name].js',
                manualChunks,
                globals: {
                    vue: 'Vue',
                },
            },
            {
                name: 'gd-eui',
                format: 'esm',
                dir: 'es',
                chunkFileNames: '[name].js',
                manualChunks,
                globals: {
                    vue: 'Vue',
                },
            },
        ],
        plugins: [
            vue({
                css: true,
                style: {
                    preprocessOptions: {
                        less: {
                            javascriptEnabled: true,
                        },
                    },
                },
            }),
            postcss({
                // extract: 'style/gd-eui.css',
                extensions: ['.css', '.less'],
                use: [
                    [
                        'less',
                        {
                            javascriptEnabled: true,
                        },
                    ],
                ],
            }),
            importCssPlugin(),
            tsPlugin,
            resolve(),
            commonjs({}),
            babel({
                exclude: '**/node_modules/**',
            }),
            // terser(),
        ],
    };

    return config;
};

const configList = [];
const indexConfig = getBaseRollupConfig(entryFileList);
configList.push(indexConfig);
export default configList;
