const { readdirSync } = require('fs');
const path = require('path');

module.exports = () => {
    return {
        plugins: [
            [
                'import',
                {
                    libraryName: '@editor/gd-eui',
                    customName: (name) => {
                        const targetComponentName = name.slice(3);
                        const componentsDir = path.join(__dirname, '../es/components');
                        let targetComponentType = '';
                        ['base', 'container', 'high-level', 'modules'].find((componentType) => {
                            const componentTypeDir = path.join(componentsDir, componentType);
                            targetComponentType = componentType;
                            const target = readdirSync(componentTypeDir).find((componentName) => {
                                return componentName === targetComponentName;
                            });
                            return target;
                        });
                        return `@editor/gd-eui/es/components/${targetComponentType}/${targetComponentName}`;
                    },
                },
            ],
        ],
    };
};
