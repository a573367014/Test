import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import vue from 'rollup-plugin-vue';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';

const getPath = (_path) => path.resolve(__dirname, _path);

const extensions = ['.js', '.ts'];

// ts
const tsPlugin = ts({
    tsconfig: getPath('./tsconfig.json'), // 导入本地ts配置
    extensions,
});

export default [{
    input: "src/index.ts",
    output: [
        {
            format: "es",
            file: './lib/index.es.js'
        },
        {
            format: "cjs",
            file: './lib/index.cjs.js'
        }
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
        tsPlugin,
        resolve(),
        commonjs({}),
        babel({
            exclude: '**/node_modules/**',
        }),
    ],
}];
