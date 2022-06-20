# editor-illusion

基于 @gaoding/illusion-sdk 封装的滤镜处理 sdk，提供为图片添加滤镜效果的简易 API。

## 安装

```bash
yarn add @gaoding/editor-illusion
```

## 快速使用

```javascript
import { EditorIllusion } from '@gaoding/editor-illusion';

const illusion = new EditorIllusion({
    encryptMode: true,  // 是否加密模式，开启后需要传入加密后的滤镜 zip 包
    preloads: [],       // 预加载数据
    useWorker: true,    // 是否使用 worker 进行渲染
}));

await illusion.checkReady();  // 需要等待 sdk 内部模块加载完成

const zipUrl = 'https://st-gdx.dancf.com/gaodingx/0/illusion/20201010-165433-d8de.zip' // 滤镜 zip 包地址
const img = document.getElementById('example-image');                   // 获取图片元素
const canvas = await illusion.renderMaterial(img, zipUrl, 1);           // 返回渲染结果 canvas

```

## 接口说明

### EditorIllusion(options: IOption, maxCache: number = 10)

滤镜渲染实例构造函数。

- options: 配置参数
  - useWorker: boolean，是否使用 worker 进行渲染。worker 模式下需要浏览器支持 offscreenCanvas，如果浏览器不支持会自动设置为 false。 默认为 true。
  - workResource: string，配置滤镜 sdk 内部虚拟文件系统的工作存储目录，默认为 '/'，一般不需要修改。
  - enableLog: boolean，是否打开控制台日志，默认为 false
  - encryptMode: boolean，是否开启加密模式，开启后需要传入加密后的滤镜 zip 包，默认为 true。
  - preloads: string[]， 需要预加载的资源列表。默认为 []，关于预加载资源，参加「支持转场、混合模式」章节
- maxCache: number, 滤镜 sdk 会基于 `LRU` 规则缓存渲染结果，该参数设置最大缓存值。默认为 10

### editorIllusion.offscreenMode: boolean

标识当前是否为 offscreenCanvas 的 Worker 模式。

### editorIllusion.checkReady(): Promise<void>

检测 sdk 内部是否初始化完成

### editorIllusion.resize(width: number, height: number): Promise<void>

强制修改滤镜 sdk 中的画布大小。

- width: number，画布宽度
- height: number，画布高度

### editorIllusion.loadFilters(zipUrl: string): Promise<Filter>

解析基础滤镜 zip 包，不会设置到 sdk 中，需要手动调用 `addEffect` 添加。

- zipUrl: string，滤镜基础 zip 包地址

返回为基础滤镜 `Filter` 对象

### editorIllusion.loadMaterial(zipUrl: string): Promise<IllusionConfig>

解析混合滤镜 zip 包，不会设置到 sdk 中，需要手动调用 `addEffect` 添加。

- zipUrl: string，混合滤镜 zip 包地址

返回内容 `IllusionConfig`:

- filters: Filter[]，混合滤镜中使用到的基础滤镜列表
- mixer: Mixer，混合滤镜中使用到的混合器
- layers: Layer[]，混合滤镜中的图层列表

### editorIllusion.setSourceImage(img: HTMLImageElement | HTMLCanvasElement): Promise<void>

设置需要渲染的图片，该方法会基于 `img` 的大小对滤镜 sdk 中的画布进行 `resize`。

- img: HTMLImageElement | HTMLCanvasElement，需要渲染的图片

### editorIllusion.resetFiltes(): Promise<void>

重制 sdk 的中的所有滤镜效果

### editorIllusion.addEffect(filters: Filter[], mixer: Mixer, layers: Layer[]): Promise<void>

将滤镜效果设置到 sdk 中，该方法不会清空已有的滤镜效果，会进行叠加。

- filters: Filter[]，混合滤镜中使用到的基础滤镜列表
- mixer: Mixer，混合滤镜中使用到的混合器
- layers: Layer[]，混合滤镜中的图层列表

### editorIllusion.render(): Promise<HTMLCanvasElement>

基于当前 sdk 中设置的滤镜效果进行渲染，返回渲染结构的 canvas。canvas 的大小与滤镜 sdk 中画布的大小相同。

### editorIllusion.complexWithStrong(sourceImage: HTMLImageElement | HTMLCanvasElement, resultImage: HTMLImageElement | HTMLCanvasElement, strong: number): Promise<HTMLCanvasElement>

基于强度将滤镜效果叠加在原图上。

- sourceImage: HTMLImageElement | HTMLCanvasElement，需要叠加效果的图片
- resultImage: HTMLImageElement | HTMLCanvasElement，叠加的图片
- strong: number，叠加强度

### editorIllusion.renderMaterial(image: HTMLCanvasElement | HTMLImageElement, zipUrl: string, strong: number, cacheKey?: string)

基于传入的图片渲染混合滤镜，并使用强度与原图进行混合。相当于 `loadMaterial`/`addEffect`/`setSourceImage`/`render`/`complexWithStrong` 的方法混合。

- image: HTMLImageElement | HTMLCanvasElement，需要渲染的图片
- zipUrl: string，混合滤镜 zip 包地址
- strong: number，叠加强度
- cacheKey: string，缓存 key，不传则不进行缓存

### editorIllusion.destory(): Promise<void>

销毁滤镜 sdk 资源，将会释放内部持用的 DOM 引用，缓存以及虚拟文件系统

## 滤镜参数修改

`EditorIllusion` 支持通过 `Filter` 对象对滤镜中的参数进行修改

```javascript
const zipUrl = 'https://st0.dancf.com/csc/208/configs/system/20210303-131232-121b.zip' // 对比度滤镜 zip 包地址
const filters = await editorIllusion.loadFilters(zipUrl);                              // 解析对比滤镜 zip 包
await editorIllusion.addEffect(filters);                                               // 添加对比度滤镜效果

/**
 *  ...进行其他操作
 * */ 

// 从解析出来的滤镜列表中找到对比度滤镜实例，每一个滤镜都满足 name 与 index 为唯一标识
const filter = filters.find(filter => filter.name === 'contrast' && filter.index === '0');  
await filters[0].updateParamValue('uniContrast', 1);                                        // 修改对比度为 100%
await editorIllusion.render()                                                               // 进行渲染
```

### 常用基础滤镜包地址与参数

#### 对比度

##### zip 包地址

<https://st0.dancf.com/csc/208/configs/system/20210303-131232-121b.zip>

##### 参数列表

|滤镜名称|name|index|参数名称|值类型|值范围|说明|
|--|--|--|--|--|--|--|
|对比度|contrast|0|uniContrast|float|0 - 1|-|

#### 色相/饱和度/亮度

##### zip 包地址

<https://st0.dancf.com/csc/208/configs/system/20210303-131314-e20b.zip>

##### 参数列表

|滤镜名称|name|index|参数名称|值类型|值范围|说明|
|--|--|--|--|--|--|--|
|色相|hslAdjust|0|hue|unit|0-255|-|
|饱和度|hslAdjust|0|saturation|float|0-1|-|
|亮度|hslAdjust|0|Lightness|float|0-1|-|

#### 清晰度

##### zip 包地址

<https://st0.dancf.com/csc/208/configs/system/20210303-131302-edf5.zip>

##### 参数列表

|滤镜名称|name|index|参数名称|值类型|值范围|说明|
|--|--|--|--|--|--|--|
|清晰度|clarityFast|3|alpha|float|0-1|-|

#### 高斯模糊

##### zip 包地址

<https://st0.dancf.com/csc/208/configs/system/20210303-131325-c7a3.zip>

##### 参数列表

|滤镜名称|name|index|参数名称|值类型|值范围|说明|
|--|--|--|--|--|--|--|
|高斯模糊x|gaussian-ex|0|sigma|float|0-100|x 轴模糊值|
|高斯模糊y|gaussian-ex|1|sigma|float|0-100|y 轴模糊值|

#### 色调/色温

##### zip 包地址

<https://st0.dancf.com/csc/208/configs/system/20210303-131335-82a7.zip>

##### 参数列表

|滤镜名称|name|index|参数名称|值类型|值范围|说明|
|--|--|--|--|--|--|--|
|色温|whiteBalance|0|temperature|float|0-1|-|
|色调|whiteBalance|0|tint|float|0-1|-|

## 支持转场、叠加效果

目前转场与叠加效果需要依赖预加载的 glsl 文件。需要在初始化的时候将相关配置 `options.preloads` 参数。

```javascript
import { EditorIllusion } from '@gaoding/editor-illusion';
import mixZipUrl from '@gaoding/illusion-sdk/lib/wasm/mixer.zip?raw';
import transitionZipUrl from '@gaoding/illusion-sdk/lib/wasm/transition.zip?raw';

const illusion = new EditorIllusion({
    preloads: [mixZipUrl, transitionZipUrl],
}));
```
