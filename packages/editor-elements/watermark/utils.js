import { createCanvas } from '@gaoding/editor-utils/canvas';
import { updateEffect } from '@gaoding/editor-utils/effect/browser/effect-actions';
import { updateShadow } from '@gaoding/editor-utils/effect/browser/shadow-actions';

function getLcm(a, b) {
    const num1 = a;
    const num2 = b;
    let c = 0;
    while (b !== 0) {
        c = a % b;
        a = b;
        b = c;
    }
    return (num1 * num2) / a;
}

export function getRepeat(model) {
    const { fullScreenInfo, template } = model;
    const repeat = [
        {
            leftIndent: 0,
            colGap: fullScreenInfo.colGap,
            rowGap: fullScreenInfo.rowGap,
            transform: template.transform,
        },
        {
            leftIndent: fullScreenInfo.leftIndent,
            colGap: fullScreenInfo.colGap,
            rowGap: fullScreenInfo.rowGap,
            transform: template.transform,
        },
    ];
    return repeat;
}
export function renderRepeat(cellCanvas, repeat) {
    const rowCanvases = [];
    let rowsHeight = 0;
    let sumHeight = 0;
    // 需要先绘制每行最小的单元水印，并计算宽度的最小公倍数
    const lcm = repeat.reduce((lcm, row) => {
        const { leftIndent, colGap, rowGap } = row;
        const transform = row.transform.toJSON();
        const cellWidth =
            Math.abs(cellCanvas.width * transform.a) + Math.abs(cellCanvas.height * transform.c);
        const cellHeight =
            Math.abs(cellCanvas.height * transform.d) + Math.abs(cellCanvas.width * transform.b);
        const [dx, dy] = [
            [cellCanvas.width, 0],
            [0, cellCanvas.height],
            [cellCanvas.width, cellCanvas.height],
        ].reduce(
            ([dx, dy], [x, y]) => {
                const _x = transform.a * x + transform.c * y;
                const _y = transform.b * x + transform.d * y;
                if (-_x > dx) {
                    dx = -_x;
                }
                if (-_y > dy) {
                    dy = -_y;
                }
                return [dx, dy];
            },
            [0, 0],
        );

        // 先绘制水印的旋转与缩放
        const canvas = createCanvas(cellWidth, cellHeight);
        const context = canvas.getContext('2d');
        context.save();
        context.setTransform(
            transform.a,
            transform.b,
            transform.c,
            transform.d,
            transform.tx + dx,
            transform.ty + dy,
        );
        context.drawImage(cellCanvas, 0, 0);
        context.restore();

        // 水平绘制 3 次以用于获取偏移后的单元水印
        // 会绘制的时候，需要保证单元水印是绕中心点旋转的，所以需要根据原始尺寸计算出中心点，然后计算出旋转后的水印渲染位置
        const repeatCanvas = createCanvas(
            (Math.max(canvas.width, cellCanvas.width) + colGap) * 3,
            Math.max(canvas.height, cellCanvas.height),
        );
        const dLeft = (cellCanvas.width - canvas.width) / 2;

        const preOffsetLeft = cellCanvas.width + colGap;
        const repeatContext = repeatCanvas.getContext('2d');
        for (let i = 0; i < 3; i++) {
            const left = i * preOffsetLeft + dLeft;
            repeatContext.drawImage(canvas, left, 0);
        }

        canvas.width = cellCanvas.width + colGap;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
            repeatCanvas,
            preOffsetLeft - (leftIndent % canvas.width),
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        canvas.rowGap = rowGap;
        canvas.dTop = (cellCanvas.height - canvas.height) / 2;
        rowCanvases.push(canvas);

        sumHeight += cellCanvas.height + rowGap;
        rowsHeight += canvas.height + rowGap;
        if (lcm === 0) {
            return canvas.width;
        } else {
            return getLcm(lcm, canvas.width);
        }
    }, 0);

    // 垂直绘制 3 次获取最小重复水印
    const vCanvas = createCanvas(lcm, Math.max(rowsHeight, sumHeight) * 3);
    const vContext = vCanvas.getContext('2d');
    let top = 0;
    for (let i = 0; i < 3; i++) {
        rowCanvases.forEach((rowCanvas) => {
            vContext.save();
            vContext.translate(0, top + rowCanvas.dTop);
            vContext.fillStyle = vContext.createPattern(rowCanvas, 'repeat-x');
            vContext.fillRect(0, 0, vCanvas.width, rowCanvas.height);
            vContext.restore();
            top += cellCanvas.height + rowCanvas.rowGap;
        });
    }

    const canvas = createCanvas(lcm, sumHeight);
    const context = canvas.getContext('2d');
    context.drawImage(vCanvas, 0, sumHeight, lcm, sumHeight, 0, 0, lcm, canvas.height);

    return canvas;
}

function getNewProps(keys, props, handlerMap, element) {
    const newProps = {};
    let hasProps = false;
    keys.forEach((key) => {
        const handler = handlerMap[key];
        if (handler) {
            hasProps = true;
            handler(props, newProps, element);
        }
    });
    return hasProps ? newProps : null;
}

const logoHandler = {
    url: function (props, targetProps) {
        targetProps.url = props.url;
        targetProps.imageUrl = '';
    },
    enable: function (props, targetProps) {
        targetProps.hidden = !props.enable;
    },
};

/**
 * 获取属性中与 logo 元素有关的参数
 * @param {Object} props - 多个水印元素属性
 */
export function logoPropsToImageProps(props) {
    if (!props) return;
    if (props.url) {
        props.logo = Object.assign({}, props.logo, { url: props.url });
    }
    const { logo } = props;
    if (logo) {
        const keys = Object.keys(logo);
        return getNewProps(keys, { url: props.url, ...logo }, logoHandler);
    }
}

const titleHandler = {
    title: function (props, targetProps) {
        targetProps.contents = [{ content: props.title }];
        targetProps.content = props.title;
    },
    titleFontSize: function (props, targetProps) {
        targetProps.fontSize = props.titleFontSize;
    },
    fontFamily: function (props, targetProps) {
        targetProps.fontFamily = props.fontFamily;
    },
    titleFontFamily: function (props, targetProps) {
        targetProps.fontFamily = props.titleFontFamily;
    },
    fontWeight: function (props, targetProps) {
        targetProps.fontWeight = props.fontWeight;
    },
    titleFontWeight: function (props, targetProps) {
        targetProps.fontWeight = props.titleFontWeight;
    },
    fontStyle: function (props, targetProps) {
        targetProps.fontStyle = props.fontStyle;
    },
    titleFontStyle: function (props, targetProps) {
        targetProps.fontStyle = props.titleFontStyle;
    },
};

/**
 * 获取属性中与 title 元素有关的参数
 * @param {Object} props - 多个水印元素属性
 */
export function titlePropsToTextProps(props) {
    if (!props) {
        return;
    }
    const keys = Object.keys(props);
    return getNewProps(keys, props, titleHandler);
}

const infoTextHandler = {
    content: function (props, targetProps) {
        targetProps.contents = [{ content: props.content }];
        targetProps.content = props.content;
    },
    infoFontSize: function (props, targetProps) {
        targetProps.fontSize = props.infoFontSize;
    },
    fontFamily: function (props, targetProps) {
        targetProps.fontFamily = props.fontFamily;
    },
    infoFontFamily: function (props, targetProps) {
        targetProps.fontFamily = props.infoFontFamily;
    },
    fontWeight: function (props, targetProps) {
        targetProps.fontWeight = props.fontWeight;
    },
    infoFontWeight: function (props, targetProps) {
        targetProps.fontWeight = props.infoFontWeight;
    },
    fontStyle: function (props, targetProps) {
        targetProps.fontStyle = props.fontStyle;
    },
    infoFontStyle: function (props, targetProps) {
        targetProps.fontStyle = props.infoFontStyle;
    },
    type: function (props, targetProps, element) {
        const textElement = element.elements.find((elem) => elem.category === 'B1');
        if (!textElement) return;
        const { relation } = textElement;
        if (relation && element.type !== 'flex') {
            const type = props.type;
            const hasIcon = !(!type || type === 'word');
            const { offset, defaultOffset, textAlign, defaultTextAlign } = relation;
            const targetOffset = hasIcon ? offset : defaultOffset;
            const targetTextAlign = hasIcon ? textAlign : defaultTextAlign;

            if (targetOffset) {
                targetProps.left = targetOffset.left;
                targetProps.top = targetOffset.top;
                targetProps.width = targetOffset.width;
                targetProps.height = targetOffset.height;
            }
            if (targetTextAlign) {
                targetProps.textAlign = targetTextAlign;
            }
        }
    },
};

/**
 * 获取属性中与 info 文字有关的参数
 * @param {Object} props - 多个水印元素属性
 * @param {Array<Object>} originInfo - 原输入项属性
 */
export function infoPropsToTextProps(props, originInfoModels) {
    if (!props) {
        return;
    }
    const { info } = props;
    const globalKeys = Object.keys(props);
    const infoProps = originInfoModels.map((originInfoModel, index) => {
        const _info = info ? info[index] : null;
        const infoKeys = globalKeys.concat(_info ? Object.keys(_info) : []);
        return getNewProps(
            infoKeys,
            Object.assign({}, props, _info),
            infoTextHandler,
            originInfoModel,
        );
    });

    return infoProps;
}

const infoImageHandler = {
    type: function (props, targetProps) {
        const iconUrl = getIcon(props.type);
        targetProps.url = iconUrl;
        targetProps.hidden = !iconUrl;
        targetProps.iconType = props.type;
    },
};

/**
 * 获取属性中与 info 图片有关的参数
 * @param {Object} props - 多个水印元素属性
 * @param {Array<Object>} originInfo - 原输入项属性
 */
export function infoPropsToImageProps(props, originInfo) {
    if (!props) {
        return;
    }

    const { info } = props;
    const globalKeys = Object.keys(props);
    const infoProps = originInfo.map((_, index) => {
        const _info = info ? info[index] : null;
        const infoKeys = globalKeys.concat(_info ? Object.keys(_info) : []);
        return getNewProps(infoKeys, Object.assign({}, props, _info), infoImageHandler);
    });

    return infoProps;
}

const backgroundHandler = {
    backgroundImage: function (props, targetProps) {
        targetProps.url = props.backgroundImage;
    },
    backgroundColor: function (props, targetProps) {
        targetProps.colors = [props.color];
    },
};

/**
 * 获取属性中与背景有关的参数
 * @param {Object} props - 多个水印元素属性
 */
export function backgroundPropsToImageProps(props) {
    if (!props) {
        return;
    }

    const { color } = props;
    const keys = color ? Object.keys(color) : [];
    return getNewProps(keys, color, backgroundHandler);
}

export function isTextElement(element) {
    if (!element) return false;
    return ['threeText', 'styledText', 'text'].includes(element.type);
}

/**
 * 修改文字元素颜色
 * @param {String} textColor - 文本颜色
 * @param {String} effectColor - 特效颜色
 * @param {Element} element - 文字元素
 * @param {Editor} editor - 编辑器实例
 */
export function changeTextColor(textColor, effectColor, element, editor) {
    const needChangeTextColor = textColor;
    const needChangeEffectColor = effectColor;
    if (!needChangeTextColor && !needChangeEffectColor) return;

    if (element.type === 'text') {
        if (needChangeTextColor) {
            editor.changeElement({ color: textColor }, element);
        }
        if (!element.mainColor) {
            const { textEffects } = element;
            textEffects.forEach((effect) => {
                const { filling = {}, stroke = {}, insetShadow = {} } = effect;
                if (!effect.enable) return;

                if (filling.enable && [0, 'color'].includes(filling.type) && needChangeTextColor) {
                    filling.color = textColor;
                }

                if (stroke.enable && needChangeEffectColor) {
                    stroke.color = effectColor;
                } else if (insetShadow.enable && needChangeEffectColor) {
                    insetShadow.color = effectColor;
                }
                updateEffect(effect);
            });
            element.shadows.forEach((shadow) => {
                if (shadow.enable && shadow.color) {
                    shadow.color = effectColor;
                    updateShadow(shadow);
                }
            });
            editor.makeSnapshotByElement(element);
        }
    } else if (element.type === 'threeText') {
        const layer = element.layers[0];
        const { frontMaterials, bevelMaterials, sideMaterials } = layer;
        if (frontMaterials.type === 0 && needChangeTextColor) {
            frontMaterials.color = textColor;
        }
        if (bevelMaterials.enable && bevelMaterials.type === 0 && needChangeEffectColor) {
            bevelMaterials.color = effectColor;
        } else if (sideMaterials.enable && sideMaterials.type === 0 && needChangeEffectColor) {
            sideMaterials.color = effectColor;
        }
    } else if (element.type === 'styledText' && needChangeTextColor) {
        editor.changeElement({ color: textColor }, element, false);
    }
}

// 检查文字元素是否可以聚合文字颜色与特效颜色
// 在水印中约定：所有水印的文字颜色相同、特效颜色相同，所以返回第一个检查到的文字颜色与特效颜色
export function aggregatedTextColors(element) {
    let textColor = null;
    let effectColor = null;
    if (element.type === 'text') {
        const { mainColor, color, textEffects, shadows } = element;
        if (!mainColor) {
            textColor = color;
            textEffects.forEach((effect) => {
                const { filling = {}, stroke = {} } = effect;

                if (!effect.enable) return;

                if (filling.enable && [0, 'color'].includes(filling.type)) {
                    textColor = filling.color;
                }

                if (stroke.enable) {
                    effectColor = stroke.color;
                }
            });
            (shadows || []).forEach((shadow) => {
                if (shadow.enable && shadow.color);
                effectColor = shadow.color;
            });
        } else {
            textColor = mainColor;
        }
    } else if (element.type === 'threeText') {
        const layer = element.layers[0];
        const { frontMaterials, bevelMaterials, sideMaterials } = layer;
        if (frontMaterials.type === 0) {
            textColor = frontMaterials.color;
        }
        if (bevelMaterials.enable && bevelMaterials.type === 0) {
            effectColor = bevelMaterials.color;
        } else if (sideMaterials.enable && sideMaterials.type === 0) {
            effectColor = sideMaterials.color;
        }
    } else if (element.type === 'styledText') {
        textColor = element.color;
    }

    return { textColor, effectColor };
}

/**
 * 修改图片、svg 的颜色和图案
 * @param {String} effectUrl - 特效图片地址
 * @param {String} effectColor - 特效颜色
 * @param {Element} element - 元素
 * @param {Editor} editor - 编辑器实例
 */
export function changeImageColor(effectUrl, effectColor, element, editor) {
    const needChangeEffect = effectUrl;
    const needChangeEffectColor = effectColor;
    if (!needChangeEffect && !needChangeEffectColor) return;
    if (['mask', 'image'].includes(element.type)) {
        if (needChangeEffect) {
            editor.changeElement(
                {
                    url: effectUrl,
                },
                element,
                false,
            );
        }
        if (needChangeEffectColor) {
            const { imageEffects, shadows = [] } = element;
            imageEffects.forEach((effect) => {
                if (!effect.enable) return;
                if (
                    effect.filling &&
                    effect.filling.enable &&
                    [0, 'color'].includes(effect.filling.type)
                ) {
                    effect.filling.color = effectColor;
                }

                if (effect.stroke && effect.stroke.enable) {
                    effect.stroke.color = effectColor;
                } else if (effect.insetShadow && effect.insetShadow.enable) {
                    effect.insetShadow.color = effectColor;
                }

                updateEffect(effect);
            });
            shadows.forEach((shadow) => {
                if (shadow.enable && shadow.color) {
                    shadow.color = effectColor;
                    updateShadow(shadow);
                }
            });
            editor.makeSnapshotByElement(element);
        }
    } else if (element.type === 'svg' && needChangeEffectColor) {
        const { colors } = element;
        if (colors) {
            colors[0] = effectColor;
            editor.changeElement(
                {
                    colors: colors,
                },
                element,
                false,
            );
        }
    }
}

// 检查图片元素是否可以聚合特效颜色
// 在水印中约定：所有水印的特效颜色相同，所以返回第一个检查到的特效颜色
export function aggregatedImageColors(element) {
    let effectColor = null;
    if (['mask', 'image'].includes(element.type)) {
        const { imageEffects, shadows } = element;
        imageEffects.forEach((effect) => {
            if (!effect.enable) return;
            if (
                effect.filling &&
                effect.filling.enable &&
                [0, 'color'].includes(effect.filling.type)
            ) {
                effectColor = effect.filling.color;
            }

            if (effect.stroke && effect.stroke.enable) {
                effectColor = effect.stroke.color;
            } else if (effect.insetShadow && effect.insetShadow.enable) {
                effectColor = effect.insetShadow.color;
            }
        });
        shadows.forEach((shadow) => {
            if (shadow.enable && shadow.color) {
                effectColor = shadow.color;
            }
        });
    } else if (element.type === 'svg') {
        const { colors } = element;
        effectColor = colors && colors[0];
    }

    return effectColor;
}

const iconMap = {
    wechat: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170057-66fa.svg',
    qq: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170002-e655.svg',
    weidian: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170131-08d4.svg',
    weibo: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170118-87a3.svg',
    taobao: 'https://st0.dancf.com/csc/208/materials/142136/20200314-170016-0871.svg',
    phone: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165936-4a8a.svg',
    mail: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165921-6eb8.svg',
    line: 'https://st0.dancf.com/csc/212/materials/40027/20200316-104225-3f7f.svg',
    ins: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165851-2a65.svg',
    instagram: 'https://st0.dancf.com/csc/208/materials/142136/20200314-165851-2a65.svg',
    facebook: 'https://st0.dancf.com/csc/212/materials/40027/20200316-104703-0e66.svg',
};

/**
 * 根据 iconType 获取 icon 图标的地址
 * @param { String } iconType - 图标类型
 */
export function getIcon(iconType) {
    return iconMap[iconType];
}
