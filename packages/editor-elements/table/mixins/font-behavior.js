import loader from '@gaoding/editor-utils/loader';
import utils from '@gaoding/editor-framework/src/utils/utils';

const DEFAULT_FONT_FAMILY =
    '-apple-system,BlinkMacSystemFont,Segoe UI,Hiragino Sans GB,Microsoft YaHei,Helvetica Neue,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol';

const isFox = utils.isFox();
const supportMiniFontSize = isFox || window.safari;

export default {
    data() {
        return {
            fallbackFonts: DEFAULT_FONT_FAMILY,
            // safari 原生支持字号小于12像素
            minFontSize: supportMiniFontSize ? 1 : 12,
            lastFont: null,
        };
    },
    watch: {
        'model.fontFamily'() {
            this.checkLoad();
        },
    },
    mounted() {
        this.checkLoad();
    },
    methods: {
        getCloseFont(name = '') {
            const { fontsMap, defaultFont, fontList } = this.options;

            if (!name) {
                name = this.model.fontFamily;
            }

            return fontsMap[name] || fontsMap[defaultFont] || fontList[0];
        },
        loadFonts() {
            const options = this.options;
            const names = this.model.getFontFamilies();
            if (!names.length) names.push(this.model.fontFamily);

            const fontLoads = names.map((name) => {
                const font = this.getCloseFont(name);
                if (!font) {
                    return Promise.resolve();
                }

                return loader.loadFont(
                    Object.assign({}, font, {
                        display: 'swap',
                        useLocal: this.options?.mode === 'mirror',
                    }),
                    options.fontLoadTimeout,
                );
            });

            return Promise.all(fontLoads);
        },
        loadImage() {
            const imageUrl = this.model.imageUrl;
            if (this.options.mode === 'mirror' && imageUrl) {
                return utils.loadImage(imageUrl, this.options.fitCrossOrigin);
            }
            return Promise.resolve();
        },
    },
};
