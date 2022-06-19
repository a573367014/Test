const puppeteer = require('puppeteer-core');
const axios = require('axios');
const path = require('path');
const Promise = require('bluebird');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const fs = require('fs');


const fontList = require('../../resources/json/prod-font-list.json');
const metaList = require('../../resources/json/meta.json');
const text = require('./text.json');
const textEffects = require('./text-effects.json');
const textContents = require('./text-contents.json');
const textFont = require('./text-font.json');

const fontFamilyMap = [
    {
        'id': 448,
        'deleted': 0,
        'name': 'Reeji-CloudZhongSong-GB-Regular',
        'alias': '锐字云字库中长宋GB',
        'family': 'Reeji-CloudZhongSong-GB',
        'style': 'normal',
        'weight': 400,
        'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20190015-164859-260c.ttf',
        'woff': 'https://st0.dancf.com/csc/3/fonts/0/20190015-164859-b2d8.woff',
        'ttf_size': 3413280,
        'woff_size': 2098100,
        'preview': {
            'url': 'https://st0.dancf.com/csc/3/fonts/0/20190015-164848-a2ec.svg',
            'width': 584,
            'height': 80
        },
        'platforms': 1023,
        'commercial_platforms': 0,
        'clients': 7,
        'commercial': 0,
        'price': 0,
        'status': 1,
        'priority': 98,
        'created_at': 1547542155,
        'updated_at': 1548752220
    },
    {
        'id': 230,
        'deleted': 0,
        'name': 'SourceHanSerifSC-Bold',
        'alias': '思源宋体 Bold',
        'family': 'Source Han Serif SC Bold',
        'style': 'normal',
        'weight': 700,
        'ttf': 'https://st0.dancf.com/csc/3/fonts/230/20180527-150944-1.ttf',
        'woff': 'https://st0.dancf.com/csc/3/fonts/230/20180527-150944-2.woff',
        'ttf_size': 4464604,
        'woff_size': 3736936,
        'preview': {
            'url': 'https://st0.dancf.com/csc/12/fonts/230/20190128-153254-2b45.svg',
            'width': 424,
            'height': 80
        },
        'platforms': 1023,
        'commercial_platforms': 0,
        'clients': 7,
        'commercial': 0,
        'price': 0,
        'status': 1,
        'priority': 88,
        'created_at': 1514951700,
        'updated_at': 1551339176
    },
    {
        'id': 335,
        'deleted': 0,
        'name': 'HYLiLiangHeiJ',
        'alias': '汉仪力量黑简',
        'family': 'HYLiLiangHeiJ',
        'style': 'normal',
        'weight': 400,
        'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135517-16.ttf',
        'woff': 'https://st0.dancf.com/csc/3/fonts/0/20180508-135517-17.woff',
        'ttf_size': 1105656,
        'woff_size': 703716,
        'preview': {
            'url': 'https://st0.dancf.com/csc/12/fonts/335/20190128-151217-30e3.svg',
            'width': 388,
            'height': 80
        },
        'platforms': 498,
        'commercial_platforms': 1023,
        'clients': 7,
        'commercial': 1,
        'price': 0,
        'status': 1,
        'priority': 97,
        'created_at': 1528437324,
        'updated_at': 1551337943
    },
    {
        'id': 437,
        'deleted': 0,
        'name': 'Reeji-CloudRuiSongCu-GB-Regular',
        'alias': '锐字云字库锐宋粗GB',
        'family': 'Reeji-CloudRuiSongCu-GB',
        'style': 'normal',
        'weight': 400,
        'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20181019-182717-f6ac.ttf',
        'woff': 'https://st0.dancf.com/csc/3/fonts/0/20181019-182717-d686.woff',
        'ttf_size': 3536584,
        'woff_size': 2121796,
        'preview': {
            'url': 'https://st0.dancf.com/csc/12/fonts/437/20190128-152446-23c7.svg',
            'width': 511,
            'height': 80
        },
        'platforms': 1023,
        'commercial_platforms': 0,
        'clients': 7,
        'commercial': 0,
        'price': 0,
        'status': 1,
        'priority': 94,
        'created_at': 1542623253,
        'updated_at': 1551338688
    },
    {
        'id': 423,
        'deleted': 0,
        'name': 'REEJI-Xiaodou-MoletongGB-Regular',
        'alias': '小豆岛默陌乐童简',
        'family': 'REEJI-Xiaodou-MoletongGB',
        'style': 'normal',
        'weight': 400,
        'ttf': 'https://st0.dancf.com/csc/3/fonts/0/20181019-181534-0a73.ttf',
        'woff': 'https://st0.dancf.com/csc/3/fonts/0/20181019-181534-5dad.woff',
        'ttf_size': 3544980,
        'woff_size': 2364668,
        'preview': {
            'url': 'https://st0.dancf.com/csc/12/fonts/423/20190128-152632-fb29.svg',
            'width': 325,
            'height': 80
        },
        'platforms': 1023,
        'commercial_platforms': 0,
        'clients': 7,
        'commercial': 0,
        'price': 0,
        'status': 1,
        'priority': 94,
        'created_at': 1542622555,
        'updated_at': 1551338795
    },
];
const testType = 'textFont';

const createText = (data) => {
    return Object.assign({}, testType === 'textContents' ? textContents : text, data);
};


const combine = (fontList, metaList) => {
    fontList.forEach(font => {
        const fontInfo = metaList.find(item => item.id === font.id);

        if(fontInfo) {
            font.meta_data = fontInfo.meta_data;
        }
    });
};

combine(fontList, metaList);

const temlateApi = 'https://www.gaoding.com/api/templets';
const detailApi = 'https://www.gaoding.com/api/templets';

const acceptDiff = 1;
const result = {
    // 0
    nodiff: [],
    // 0 ~ 1
    smalldiff: [],
    // 1+
    bigdiff: [],
    count: 0,
    totalDiff: 0,
};

const fetchTemlates = (
    page_num = 1,
    page_size = 10
) => {
    return axios.get(temlateApi, {
        params: {
            page_num,
            page_size
        }
    }).then(res => res.data).then((temlateList) => {
        return Promise.map(temlateList, (item) => {
            return axios.get(`${detailApi}/${item.id}`).then(res => res.data);
        });
    });
};

/**
 * 读取路径信息
 * @param {string} path 路径
 */
function getStat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if(err) {
                resolve(false);
            }
            else {
                resolve(stats);
            }
        });
    });
}

/**
 * 创建路径
 * @param {string} dir 路径
 */
function mkdir(dir) {
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => {
            if(err) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
}

/**
 * 路径是否存在，不存在则创建
 * @param {string} dir 路径
 */
async function dirExists(dir) {
    const isExists = await getStat(dir);

    if(isExists && isExists.isDirectory()) {
        return Promise.resolve();
    }

    return mkdir(dir);
}

const saveImage = (url, name, dir) => {
    const base64Data = url.replace(/^data:image\/\w+;base64,/, '');

    return new Promise((resolve) => {
        const saveUrl = path.resolve(__dirname, `../../matcher/${testType}/${dir}/${name}`);

        return dirExists(path.join(__dirname, `../../matcher/${testType}/${dir}`)).then(() => {
            fs.writeFile(saveUrl, base64Data, { encoding: 'base64' }, (err) => {
                if(err) {
                    console.log('保存失败', err);
                }
                else {
                    console.log('保存文件成功');
                }
                resolve(saveUrl);
            });
        });
    });
};

function readImage(url) {
    return new Promise((resolve) => {
        fs.createReadStream(url).pipe(new PNG()).on('parsed', (img) => {
            resolve(img);
        });
    });
}

function doneReading(img1, img2, dir, width = 700, height = 700) {
    const diff = new PNG({ width, height });

    const mismatchedPixels = pixelmatch(img1, img2, diff.data, width, height, { threshold: 0.1 });
    const ratio = mismatchedPixels / (width * height);
    const ratioStr = +(ratio * 100).toFixed(2);

    if(ratioStr === 0) {
        result.nodiff.push({
            diff: ratioStr,
            name: dir,
            width,
            height
        });
    }
    else if(ratioStr < acceptDiff) {
        result.smalldiff.push({
            diff: ratioStr,
            name: dir,
            width,
            height
        });
    }
    else {
        result.bigdiff.push({
            diff: ratioStr,
            name: dir,
            width,
            height
        });
    }
    result.totalDiff += ratioStr;
    result.count += 1;

    return new Promise((resolve) => {
        diff.pack().pipe(fs.createWriteStream(path.resolve(__dirname, `../../matcher/${testType}/${dir}/diff.png`))).on('finish', () => {
            resolve();
        });
    });
};

async function screenshotDOMElement(page, selector) {
    const rect = await page.$(selector);
    const url = await rect.screenshot({
        encoding: 'base64'
    });

    return url;
};

const compareByTextEffects = async(page) => {
    return Promise.mapSeries(fontList, font => {
        return Promise.mapSeries(textEffects.layouts, (layout, index) => {
            const element = layout.elements[0];
            const meta = font.meta_data || {};
            const ascent = meta.ascent / meta.emSize;
            const descent = meta.descent / meta.emSize;
            const height = (Math.abs(ascent) + Math.abs(descent)) * 2 * element.fontSize || 100;

            element.height = height;

            const template = {
                version: '6.1.0-alpha.0',
                type: 'poster',
                global: {
                    zoom: 1,
                    source: 'gaoding'
                },
                layouts: [layout]
            };
            return compareTemplate(page, template, font.name + index);
        });
    });
};

const compareByFontList = async(page) => {
    return Promise.mapSeries(fontList, font => {
        const element = createText({
            fontFamily: font.name
        });
        const meta = font.meta_data || {};
        const ascent = meta.ascent / meta.emSize;
        const descent = meta.descent / meta.emSize;
        const height = (Math.abs(ascent) + Math.abs(descent)) * 2 * element.fontSize || 100;

        element.height = height;
        const template = {
            version: '6.1.0-alpha.0',
            type: 'poster',
            global: {
                zoom: 1,
                source: 'gaoding'
            },
            layouts: [
                {
                    title: font.name,
                    backgroundSize: null,
                    backgroundImage: null,
                    backgroundColor: '#ffffffff',
                    backgroundRepeat: 'no-repeat',
                    height: height,
                    width: 200,
                    elements: [
                        element,
                    ],
                    top: 0
                }
            ]
        };

        return compareTemplate(page, template, font.name);
    });
};

const compareTemplate = async(page, template, title) => {
    await page.waitForSelector('.editor-shell-wrap');

    const { url: frontExportUrl, width, height } = await page.evaluate((template) => {
        const { editor } = window;

        return editor.setTemplet(template).then(() => {
            return new Promise((resolve) => {
                editor.$on('templetLoaded', () => {
                    resolve();
                });
            });
        }).then(() => editor.exportImage().then(canvas => {
            if(canvas) {
                const zoom = editor.zoom;
                const tempCanvas = document.createElement('canvas');
                const ctx = tempCanvas.getContext('2d');

                const width = Math.round(canvas.width * zoom);
                const height = Math.round(canvas.height * zoom);
                tempCanvas.width = width;
                tempCanvas.height = height;
                ctx.drawImage(canvas, 0, 0, width, height);

                return {
                    width,
                    height,
                    url: tempCanvas.toDataURL('image/png')
                };
            }
            return {
                url: null,
                width: 0,
                height: 0,
            };
        })).catch(err => console.log(err));
    }, template).catch(err => console.log('页面执行报错', err));

    if(!frontExportUrl) {
        console.log('不支持前端出图');
        return null;
    }

    // de
    await page.waitFor(1000);
    const screenshotUrl = await screenshotDOMElement(page, '.editor-shell');

    return Promise.all([
        saveImage(screenshotUrl, `${title}+截图.png`, title),
        saveImage(frontExportUrl, `${title}+前端出图.png`, title)
    ]).then(([path1, path2]) => {
        if(!path1 || !path2) {
            console.log('图片不存在');
            return Promise.resolve(null);
        }
        return Promise.all([
            readImage(path1),
            readImage(path2),
        ]).then(([img1, img2]) => {
            return doneReading(img1, img2, title, width, height);
        });
    });
};
const compareByFontSize = (page) => {
    return Promise.mapSeries(fontFamilyMap, font => {
        const element = Object.assign({}, textFont, {
            fontFamily: font.name
        });
        const template = {
            version: '6.1.0-alpha.0',
            type: 'poster',
            global: {
                zoom: 1,
                source: 'gaoding'
            },
            layouts: [
                {
                    title: font.name,
                    backgroundSize: null,
                    backgroundImage: null,
                    backgroundColor: '#ffffffff',
                    backgroundRepeat: 'no-repeat',
                    height: 500,
                    width: 500,
                    elements: [
                        element,
                    ],
                    top: 0
                }
            ]
        };

        return compareTemplate(page, template, font.name);
    });
};

const compareByTemplateList = (
    page,
    page_num = 1,
    page_size = 10
) => {
    return fetchTemlates(page_num, page_size).then((list) => {
        return Promise.mapSeries(list, async(item) => {
            const { content, title } = item;
            const template = JSON.parse(content);
            return compareTemplate(page, template, title);
        });
    });
};

const sort = (arr) => {
    return arr.sort((a, b) => a.diff - b.diff);
};


(async() => {
    await puppeteer.defaultArgs({
        args: ['--window-size=1500, 1500']
    });
    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: {
            width: 1000,
            height: 1000
        },
        diffThreshold: 0.5,
        poolTimeout: 60,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/');

    const options = {
        page_num: 2,
        page_size: 100,
    };
    const testMap = {
        textFont: compareByFontSize,
        // 英文单纯字体
        font: compareByFontList,
        textContents: compareByFontList,
        textEffects: compareByTextEffects,
        // 中文单纯字体
        fontCN: compareByFontList,
        // 请求线上模板生成对比数据
        template: compareByTemplateList,
    };

    return dirExists(path.join(__dirname, '../../matcher')).then(() => {
        // return compareByTemplateList(page, options.page_num, options.page_size, options.platform_id, options.category_id, options.roles);

        return dirExists(path.join(__dirname, `../../matcher/${testType}`)).then(() => {
            return testMap[testType](page, options.page_num, options.page_size);
        });
    }).then(() => {
        result.nodiff = sort(result.nodiff);
        result.smalldiff = sort(result.smalldiff);
        result.bigdiff = sort(result.bigdiff);
        result.acceptNum = result.nodiff.length + result.smalldiff.length;
        fs.writeFileSync(path.resolve(__dirname, `../../matcher/${testType}/${testType}-diff.json`), JSON.stringify(result));

        return null;
    });
})();
