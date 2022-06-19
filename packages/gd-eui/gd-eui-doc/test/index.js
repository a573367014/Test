const { GdEuiDoc } = require('../index');
const path = require('path');
const gdeuiDoc = new GdEuiDoc();

async function main() {
    gdeuiDoc.load(
        // path.resolve(__dirname, '../../vue-typescript-dpapp-demo/src/components/shops.vue'),
        // path.resolve(__dirname, '../../src/index.ts'),
        // path.resolve(__dirname, '../../src/components/modules/image/image.vue'),
        // path.resolve(__dirname, '../../src/vue/.index.ts'),
        // path.resolve(__dirname, '../../src/components/high-level/waterfall/waterfall.vue'),
        // path.resolve(__dirname, '../../src/components/modules/tag-select/tag-select.vue'),
        path.resolve(__dirname, '../../src/components/modules/color-picker/main-color-picker.vue'),
        // path.resolve(__dirname, '../../src/components/modules/layout-ratio/layout-ratio.vue'),
        // path.resolve(
        //     __dirname,
        //     '../../src/components/modules/style-background/style-background.vue',
        // ),
        // path.resolve(__dirname, '../../src/components/modules/slider-list/slider-list.vue'),
        // path.resolve(
        //     __dirname,
        //     '../../src/components/modules/style-select-item-list/style-select-item-list.vue',
        // ),
        path.resolve(__dirname, '../../tsconfig.json')
        // path.resolve(__dirname, '../../vue-typescript-dpapp-demo/tsconfig.json')
        
    );
    // const list = gdeuiDoc.getDataForTypes();
    // console.log(list);
    // console.log(gdeuiDoc.getMdForTemplateSlots());
    // console.log(gdeuiDoc.getMdForEmits());
    // console.log(gdeuiDoc.getDataForMarkdownList());
    // console.log(gdeuiDoc.getMdForMarkdowns());

    // gdeuiDoc.load(
    //     // path.resolve(__dirname, '../../src/components/high-level/waterfall/waterfall.vue'),
    //     path.resolve(__dirname, '../../src/components/modules/color-picker/main-color-picker.vue'),
    //     // path.resolve(__dirname, '../../src/types/waterfall.ts'),
    //     path.resolve(__dirname, '../assets/types.json'),
    // );
    // gdeuiDoc.getMdForTypes();
    console.log('gdeuiDoc.getMdForTypes', gdeuiDoc.getMdForTypes());
    // gdeuiDoc.getAllUsedTypes();
    // gdeuiDoc.getMdForTypes();
    // gdeuiDoc.getMdForTitles();
    // gdeuiDoc.getMdForVueProperties();
    // gdeuiDoc.getMdForEmits();
    // gdeuiDoc.getMdForFunction();
    // gdeuiDoc.getDataForTitles();
    // gdeuiDoc.getDataForVueProperties();
    // gdeuiDoc.getDataForEmits();
    // gdeuiDoc.getDataForFunction();
}
main();
