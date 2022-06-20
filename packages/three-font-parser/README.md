# @gaoding/three-font-parser

生成 3d 文字所需的数据。

## 如何安装

``` sh
$ npm i @gaoding/three-font-parser
```

## 如何使用

``` javascript
import { loadFont, createTextModel } from '@gaoding/three-font-parser'

// url
const font = await loadFont(url);
const model = createTextModel('text', {
    font: font,
    fontSize: 50,
    extrudeDepth: 2,
    extrudeOffsetX: 0,
    extrudeOffsetY: 0,
    extrudeOffsetScale: 0,
    curveSegments: 12,
    fontWeight: 'regular',
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 0.5,
    bevelSegments: 3,
    // quadEllipse, halfEllipse, line
    bevelType: 'quadEllipse',
    extrudeOffsetX: 0,
    extrudeOffsetY: 0,
    extrudeScaleX: 0,
    extrudeScaleY: 0,
    // earcut, poly2tri
    triangulateMethod: 'earcut',
    // use web worker
    worker: true
})
```

## 注意事项

## 开启 bug 模式

`localStorage.debug = 'three-font-parser:*';`

### 如何同步代码

目录中 libs 里的 three.js 代码主要来源于 ai，如需同步 ai 代码，请依照下述流程：

1. 切换至 `f_ai_demo` 分支
2. 找到 ai 最新的改动 commit
3. cherry-pick commit