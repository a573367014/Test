/* eslint-disable */
import UPNG from './upng';
import { GifWriter } from 'omggif';

// GIF 生成, 从 https://www.photopea.com/ 抠的
// datas = [Uint8Array, delay]
export async function exportGif(datas, width, height, config) {
    if (!config) {
        // 质量、速率、循环次数、是否禁止透明度
        config = [100, 0, 0, false];
    }

    let buffers = [];
    let delays = [];
    let pixelLength = width * height * 4;
    let transparent = null;

    for (let j = 0; j < datas.length; j++) {
        let uint8 = datas[j][0];

        if (!config[3]) {
            for (let i = 0; i < pixelLength; i += 4) {
                let alpha = (uint8[i + 3] = uint8[i + 3] > 127 ? 255 : 0);
                if (alpha == 0) uint8[i] = uint8[i + 1] = uint8[i + 2] = 0;
            }
        }

        buffers.push(uint8.buffer);
        delays.push(datas[j][1]);
    }

    // psize ：调色板尺寸（想要多少种颜色）
    let psize = Math.round(2 + (254 * config[0]) / 100);

    // { ctype: 文件的颜色类型（Truecolor，灰度，调色板...）, depth: 像素数据的位深度（1、2、4、8、16）, plte: 调色板-颜色列表, frames: 有关帧的其他信息（帧延迟等）  }
    let params = [buffers, width, height, psize, [!0, !1, !1, 8, !1], config[3]];
    let info = UPNG.encode.compress(...params);

    let plte = info.plte;
    let rbga = new Uint8Array(4);
    let unit32Rgba = new Uint32Array(rbga.buffer);

    for (let i = 0; i < plte.length; i++) {
        unit32Rgba[0] = plte[i];
        let r = rbga[0];
        rbga[0] = rbga[2];
        rbga[2] = r;
        plte[i] = unit32Rgba[0];
        if (unit32Rgba[0] == 0) transparent = i;
    }

    while (plte.length < 256) plte.push(0);

    let resultBuf = new Uint8Array(2e3 + width * height * datas.length);
    let loop = config[2];
    let options = { palette: plte };

    if (loop != 1) options.loop = loop == 0 ? 0 : loop - 1;
    let gif = new GifWriter(resultBuf, width, height, options);

    for (let i = 0; i < datas.length; i++) {
        let frame = info.frames[i];
        let rect = frame.rect;
        let dispose = frame.dispose;

        gif.addFrame(rect.x, rect.y, rect.width, rect.height, frame.img, {
            transparent: transparent,
            disposal: dispose + 1,
            delay: Math.round(delays[i] / 10),
        });

        // 释放内存
        info.frames[i] = null;
    }

    return resultBuf.slice(0, gif.end()).buffer;
}
