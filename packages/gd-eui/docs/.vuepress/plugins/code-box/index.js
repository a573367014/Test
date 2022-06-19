const {
    fs,
    path,
    globby,
    datatypes: { isString },
} = require("@vuepress/shared-utils");

function fileToComponentName(file) {
    return file.replace(/\/|\\|\.|-/g, "_");
}

async function resolveComponents(componentDir) {
    if (!fs.existsSync(componentDir)) {
        return;
    }
    return await globby(["**/*.vue"], { cwd: componentDir });
}

let moduleId = 0;
let markdown;
module.exports = (options, context) => ({
    name: "vue-plugin-demo-block",
    multiple: true,
    extendMarkdown(md) {
        markdown = md;
    },
    async enhanceAppFiles() {
        const {
            componentsDir = [],
            components = [],
            getComponentName = fileToComponentName,
        } = options;
        const baseDirs = Array.isArray(componentsDir)
            ? componentsDir
            : [componentsDir];

        function importCode(name, absolutePath) {
            moduleId += 1;
            return `
        const ${name} = require(${JSON.stringify(absolutePath)}).default.name || "${name}";
        Vue.component(${name}, resolve => resolve(require(${JSON.stringify(absolutePath)}).default));
        sourceCodeMap[${name} + ''] = require('!!raw-loader!${absolutePath}').default;
        `;
        }

        function genImport(baseDir, file) {
            const name = getComponentName(file);
            const absolutePath = path.resolve(baseDir, file);
            const code = importCode(name + moduleId, absolutePath);
            return code;
        }

        let code = "";

        // 1. Register components in specified directories
        for (const baseDir of baseDirs) {
            if (!isString(baseDir)) {
                continue;
            }
            const files = (await resolveComponents(baseDir)) || [];
            code +=
                files.map((file) => genImport(baseDir, file)).join("\n") + "\n";
        }
        // 2. Register named components.

        code = `
        import Vue from 'vue';
        import CodeBox from '${path.resolve(__dirname, "code-box.vue")}';
        const sourceCodeMap = {};
        ${code}
        CodeBox.sourceCodeMap = sourceCodeMap;
        Vue.component('code-box', CodeBox);
    `;

        return [
            {
                name: `global-example.js`,
                content: code,
            },
        ];
    },
});
