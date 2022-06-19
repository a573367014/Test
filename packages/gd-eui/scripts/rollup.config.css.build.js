import path from 'path';
import { copyFileSync } from 'fs';
import { OUTPUT_LIB_DIR, OUTPUT_ES_DIR } from './config';
import resolve from 'rollup-plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { walkSync, createComponentStyleConfig, mkdirsSync } from './utils';

const cssConfigList = [];

function loadCssConfig() {
    const outDirs = [OUTPUT_LIB_DIR, OUTPUT_ES_DIR];
    outDirs.forEach((outDir) => {
        walkSync(path.resolve(__dirname, '../src/'), function (filePath) {
            const index = filePath.lastIndexOf('/src');
            /**
             * eg: /components/base/slider/style/index.less
             * eg: /style/index.less
             */
            const lessFilePath = filePath.substring(index + 4, filePath.length);
            const cssFilePath = lessFilePath.replace('.less', '.css');
            if (lessFilePath.indexOf('.less') === -1) {
                return;
            }
            const targetPath = path.resolve(__dirname, `../${outDir}/` + lessFilePath);
            mkdirsSync(targetPath.substring(0, targetPath.lastIndexOf('/')));
            copyFileSync(filePath, path.resolve(__dirname, targetPath));
            const config = createComponentStyleConfig(
                `src${lessFilePath}`,
                `${outDir}/css-index.js`,
                cssFilePath.substring(1),
            );
            cssConfigList.push(config);
        });
    });
}

/**
 * 组件样式独立打包
 * @param {string} input
 * @param {sting} output
 */
function baseStyleConfig(input, output) {
    /**
     * import ts 转 js，抽离css.js
     * @returns {import('rollup').Plugin}
     */
    const plugin = () => {
        return {
            transform(code, id) {
                /**
                 * 生成css.js，用于css方式引入
                 * id: xxx/src/components/modules/slider-list/index.ts
                 * case1: @gaoding/gd-antd/es/dropdown/style/
                 * case2: @gaoding/gd-antd/es/dropdown/style/css.js
                 * case3: @gaoding/gd-antd/es/dropdown/style/index.less
                 * case4: @gaoding/gd-antd/es/dropdown/style/index.js
                 * case5: @gaoding/gd-antd/es/dropdown/style
                 * case6: ../../../base/slider/style/index.js
                 * case7: ../../../base/slider/style/
                 * case8: ../../../base/slider/style
                 * case9: ./index.less
                 * target:
                 *  - @gaoding/gd-antd/es/dropdown/style/css.js
                 *  - ../../../base/slider/style/css.js
                 */
                let content = '';
                const matchs = code.match(/[\w\d\s./@\-_']+\/style(\/|')/g);
                matchs &&
                    matchs.forEach((element) => {
                        let target = '';
                        if (element.charAt(element.length - 1) === `'`) {
                            element = element.substring(0, element.length - 1);
                        }
                        if (element.charAt(element.length - 1) === '/') {
                            target = `${element}css.js';\n`;
                        } else {
                            target = `${element}/css.js';\n`;
                        }
                        if (target.indexOf('@gaoding/gd-antd') === -1) {
                            target = target.replace('css.js', 'index.css');
                        }
                        content = content + target;
                    });
                // 组件目录
                if (id.lastIndexOf('src/style/index.ts') === -1) {
                    content = content + `import './index.css';\n`;
                } else {
                    // 根目录
                    content = content + `import './themes/index.css';\n`;
                }
                this.emitFile({
                    type: 'asset',
                    fileName: 'css.js',
                    source: content.replace(/\n+/g, '\n'),
                });

                return code.replace('.ts', '.js');
            },
        };
    };
    return {
        input: input,
        // 不做引入编译
        external: () => {
            return true;
        },
        output: [
            {
                file: path.resolve(__dirname, `../es/${output}`),
                format: 'es',
            },
            {
                file: path.resolve(__dirname, `../lib/${output}`),
                format: 'cjs',
            },
        ],
        plugins: [
            resolve(),
            commonjs({}),
            babel({
                exclude: '**/node_modules/**',
            }),
            plugin(),
        ],
    };
}

function loadComponentStyle() {
    const inputPath = path.resolve(__dirname, '../src/style/index.ts');
    const config = baseStyleConfig(inputPath, 'style/index.js');
    cssConfigList.push(config);
    walkSync(path.resolve(__dirname, '../src/components/'), function (filePath) {
        if (!filePath.match(/\/style\/[a-zA-Z-]+\.ts/)) {
            return;
        }
        const output = filePath.match(/components\/.*/)[0];
        const config = baseStyleConfig(filePath, output.replace('.ts', '.js'));
        cssConfigList.push(config);
    });
}

loadCssConfig();
loadComponentStyle();

export default cssConfigList;
