/**
 * 创建组件模版
 * - 自动创建组件，所在目录 src/components/xxx/xx
 * - 自动创建组件文档，所在目录 docs/components/xxx/xxx
 * - 自动创建组件demo，所在目录 demo/demo-xxx
 * - 自动修改引用，所在目录 src/components/xxx/index.ts
 */

const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');

const ComponentType = {
    Base: 'base',
    Container: 'container',
    HighLevel: 'high-level',
    Modules: 'modules',
};

function allComponents() {
    const list = [];
    for (const key in ComponentType) {
        const type = ComponentType[key];
        const files = fs.readdirSync(path.resolve(__dirname, `../src/components/${type}`));
        files.forEach((file) => {
            if (file.lastIndexOf('.') === -1) {
                list.push(file);
            }
        });
    }
    return list;
}

/**
 * 递归创建目录
 * @param {string} dirPath
 */
const mkdirsSync = (dirPath) => {
    if (fs.existsSync(dirPath)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirPath))) {
            fs.mkdirSync(dirPath);
            return true;
        }
    }
};

/**
 * 组件名转大写 eg: case-demo -> CaseDemo
 * @param {string} componentName
 */
const getComponentNameUpCase = (componentName) => {
    let componentNameUpCase = '';
    componentNameUpCase = componentName.split('-').reduce((pre, item) => {
        let firstChar = item.charAt(0);
        firstChar = firstChar.toUpperCase();
        return pre + firstChar + item.substring(1);
    }, '');
    return componentNameUpCase;
};
/**
 * 模版内容中的指定符号替换为对应的组件名、组件类别
 * @param {string} filePath 文件
 * @param {string} componentName 组件名
 * @param {string} componentType 组件类别
 */
const readFileAndReplace = (filePath, componentName, componentType = '') => {
    let content = fs.readFileSync(filePath, 'utf-8');
    const reg = /(XXX)/g;
    const reg2 = /(xxx)/g;
    const reg3 = /(ccc)/g;
    const componentNameUpCase = getComponentNameUpCase(componentName);
    content = content.replace(reg, componentNameUpCase);
    content = content.replace(reg2, componentName);
    content = content.replace(reg3, componentType);
    return content;
};
// const docsComponentDir = path.resolve(__dirname, '../docs/components');
const srcComponentDir = path.resolve(__dirname, '../src/components');
// const insertHtmlMatch = '<!-- >>> insert component -->';
const insertImportMatch = '// >>> insert component';
const insertRouterMatch = '// >>> insert component router';
// const insertComponentMatch = '// >>> insert AsyncComponent';
const promptList = [
    {
        type: 'list',
        message: '选择要新建的组件类型:',
        name: 'component-type',
        choices: [
            ComponentType.Base,
            ComponentType.Container,
            ComponentType.HighLevel,
            ComponentType.Modules,
        ],
        filter: function (val) {
            return val;
        },
    },
    {
        type: 'input',
        message: '请输入组件名（eg: color-picker）:',
        name: 'component-name',
        filter: function (val) {
            return val;
        },
        validate: function (val) {
            const res = val.match(/^[a-z][a-z-]+[a-z]$/g);
            if (!res || res[0].length !== val.length) {
                return '请按格式输入（eg: color-picker）';
            }
            if (allComponents().includes(res[0])) {
                return '此组件已命名，请换个命名。';
            }
            return true;
        },
    },
    {
        type: 'confirm',
        message: '请检查，是否确认创建？',
        name: 'confirm-create',
    },
];

inquirer.prompt(promptList).then((answers) => {
    const componentType = answers['component-type'];
    const componentName = answers['component-name'];
    const componentNameUpCase = getComponentNameUpCase(componentName);
    const confirm = answers['confirm-create'];
    if (!confirm) {
        return;
    }
    const componentDocsDir = path.resolve(__dirname, `../docs/components/${componentType}/`);
    const docsFileList = fs.readdirSync(componentDocsDir);
    // 组件docs
    const componentDocsFilePath = path.join(
        componentDocsDir,
        `/${docsFileList.length + 1}-${componentName}.md`,
    );
    const componentDir = path.join(srcComponentDir, `/${componentType}/${componentName}`);
    const componentStyleDir = path.join(
        srcComponentDir,
        `/${componentType}/${componentName}/style`,
    );
    // 创建组件目录
    mkdirsSync(componentDir);
    // 创建组件style目录
    mkdirsSync(componentStyleDir);

    // 组件vue 模版
    const templateComponentVueFilePath = path.resolve(__dirname, './template/xxx.vue');
    // 组件index.ts 模版
    const templateComponentTsFilePath = path.resolve(__dirname, './template/index.ts');
    // 组件style index.less 模版
    const templateComponentStyleIndexLessFilePath = path.resolve(
        __dirname,
        './template/style/index.less',
    );
    // 组件style index.ts 模版
    const templateComponentStyleIndexTsFilePath = path.resolve(
        __dirname,
        './template/style/index.ts',
    );
    // 组件style index.ts 模版
    const templateComponentDemoFilePath = path.resolve(__dirname, './template/demo.vue');
    // 组件docs 模版
    const templateComponentDocsFilePath = path.resolve(__dirname, './template/doc.md');

    // 写入vue
    const vueContent = readFileAndReplace(templateComponentVueFilePath, componentName);
    fs.writeFileSync(path.join(componentDir, `/${componentName}.vue`), vueContent);
    // 写入ts
    const tsContent = readFileAndReplace(templateComponentTsFilePath, componentName);
    fs.writeFileSync(path.join(componentDir, `/index.ts`), tsContent);
    // 写入style index ts
    const styleIndexTsContent = readFileAndReplace(
        templateComponentStyleIndexTsFilePath,
        componentName,
    );
    fs.writeFileSync(path.join(componentDir, `/style/index.ts`), styleIndexTsContent);
    // 写入style index less
    const styleIndexLessContent = readFileAndReplace(
        templateComponentStyleIndexLessFilePath,
        componentName,
    );
    fs.writeFileSync(path.join(componentDir, `/style/index.less`), styleIndexLessContent);
    // 写入demo
    const demoContent = readFileAndReplace(
        templateComponentDemoFilePath,
        componentName,
        componentType,
    );
    fs.writeFileSync(
        path.resolve(__dirname, `../demo/components/demo-${componentName}.vue`),
        demoContent,
    );
    // 写入docs md
    const docsMdContent = readFileAndReplace(
        templateComponentDocsFilePath,
        componentName,
        componentType,
    );
    fs.writeFileSync(componentDocsFilePath, docsMdContent);

    // 组件文件引入
    const modulePath = path.join(srcComponentDir, `/${componentType}/index.ts`);
    const typeIndexTsContent = fs.readFileSync(modulePath, 'utf-8');
    const splImportList = typeIndexTsContent.split('\n');
    let targetSearch = '';
    for (let index = splImportList.length - 1; splImportList.length > 0; index--) {
        const item = splImportList[index];
        if (item.indexOf('import') !== -1) {
            targetSearch = item;
            break;
        }
    }
    const start = typeIndexTsContent.lastIndexOf(targetSearch) + targetSearch.length + 1;
    const preContent = typeIndexTsContent.substring(0, start);
    let lastContent = typeIndexTsContent.substring(start, typeIndexTsContent.length);
    const importList = lastContent.match(/Ge[A-Za-z]*/g);
    lastContent = importList.reduce((pre, item) => {
        return pre + ` ${item},`;
    }, '');
    lastContent = `export {${lastContent} Ge${componentNameUpCase} };\n`;
    if (lastContent.length > 80) {
        lastContent = importList.reduce((pre, item) => {
            return pre + `    ${item},\n`;
        }, '');
        lastContent = `export {\n${lastContent}    Ge${componentNameUpCase},\n};\n`;
    }
    const newContent =
        preContent + `import Ge${componentNameUpCase} from './${componentName}';\n\n` + lastContent;
    fs.writeFileSync(modulePath, newContent);

    // type 引入
    const typePath = path.join(__dirname, `../src/types/index.ts`);
    const componetTypePath = path.join(__dirname, `../src/types/${componentName}.ts`);
    let typesContent = fs.readFileSync(typePath, 'utf-8');
    typesContent = typesContent + `export * from './${componentName}';\n`;
    typesContent = typesContent.replace(/\n+/g, '\n');
    fs.writeFileSync(
        componetTypePath,
        `export const Ge${componentNameUpCase}Name = 'Ge${componentNameUpCase}';\n`,
    );
    fs.writeFileSync(typePath, typesContent);

    // 组件样式引入
    const styleIndexPath = path.resolve(__dirname, '../src/style/index.ts');
    let styleIndexContent = fs.readFileSync(styleIndexPath, 'utf-8');
    styleIndexContent =
        styleIndexContent + `import '../components/${componentType}/${componentName}/style';\n`;
    fs.writeFileSync(styleIndexPath, styleIndexContent);

    // demo 插入引入
    const demoMainPath = path.resolve(__dirname, `../demo/router.js`);
    let demoMainContent = fs.readFileSync(demoMainPath, 'utf-8');
    demoMainContent = demoMainContent.replace(
        insertImportMatch,
        `import Demo${componentNameUpCase} from './components/demo-${componentName}';\n${insertImportMatch}`,
    );

    demoMainContent = demoMainContent.replace(
        insertRouterMatch,
        `{
        path: '/${componentType}/${componentName}',
        name: '/${componentType}/${componentName}',
        meta: {
            component: '${componentName}',
        },
        component: Demo${componentNameUpCase},
    },
    ${insertRouterMatch}`,
    );
    fs.writeFileSync(demoMainPath, demoMainContent);
});
