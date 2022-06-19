import path from 'path';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import postcss from 'rollup-plugin-postcss';

export const mkdirsSync = (pathName) => {
    if (existsSync(pathName)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(pathName))) {
            mkdirSync(pathName);
            return true;
        }
    }
};

export const existsFileSync = (filePath) => {
    try {
        const stat = statSync(filePath);
        return stat.isFile();
    } catch (er) {
        return false;
    }
};

export const getAllFiles = (dirPath) => {
    const fileList = [];
    const walkFile = (currentDirPath) => {
        readdirSync(currentDirPath).forEach(function (name) {
            const filePath = path.join(currentDirPath, name);
            const stat = statSync(filePath);
            if (stat.isFile()) {
                fileList.push(filePath);
            } else if (stat.isDirectory()) {
                walkFile(filePath);
            }
        });
    };
    walkFile(dirPath);
    return fileList;
};

export const walkSync = (currentDirPath, callback) => {
    readdirSync(currentDirPath).forEach(function (name) {
        const filePath = path.join(currentDirPath, name);
        const stat = statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
};

export const getAllComponentsDirName = () => {
    const list = [];
    const componentMap = new Map();
    walkSync(path.resolve(__dirname, '../src/components/'), function callback(filePath) {
        const styleIndex = filePath.lastIndexOf('/style/');
        const lessIndex = filePath.lastIndexOf('.less');
        if (styleIndex < 0 || lessIndex < 0) {
            return;
        }
        const componentIndex = filePath.lastIndexOf('/components/');
        const componentWrapPath = filePath.substring(componentIndex, styleIndex);
        const componentDir = componentWrapPath.substring(
            componentWrapPath.lastIndexOf('/') + 1,
            componentWrapPath.length,
        );
        if (componentMap.has(componentDir)) {
            return;
        }
        componentMap.set(componentDir, componentDir);
        list.push(componentDir);
    });
    return list;
};

export const createComponentStyleConfig = (input, output, cssFilePath) => {
    function cssFilterOutputPlugin() {
        return {
            closeBundle() {
                if (existsFileSync(output)) {
                    unlinkSync(output);
                }
            },
        };
    }
    return {
        input: input,
        output: {
            file: output,
            format: 'es',
        },
        plugins: [
            postcss({
                extract: cssFilePath,
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
            cssFilterOutputPlugin(),
        ],
    };
};
