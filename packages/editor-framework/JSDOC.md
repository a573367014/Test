## CLASSES - Editor
编辑器调用全局只暴露一个 `editor` 对象，  只是针对方法、属性的用途做了局部的拆分
- `Editor` 为基本属性、方法
- `EditorTempletMixin` 操作模板相关的方法
- `EditorLayoutMixin` 操作布局元素的相关方法
- `EditorSnapshotMixin` 操作历史快照相关方法
- `EditorElementMixin` 操作元素相关的方法
- `EditorTextElementMixin` 元素类型的相关方法
- `EditorMiscElementMixin` 综合性用途的相关方法

### 例如
```js
// 查看版本号
editor.version

// EditorElementMixin
// 添加元素
editor.addElement(...);

// EditorTextElementMixin
// 添加文本元素
editor.addText(...);

// EditorLayoutMixin
// 添加布局元素
editor.addLayout(...)

// EditorSnapshotMixin
// 重做
editor.redo();

// EditorTempletMixin
// 导入模板数据
editor.setTemplet()

// EditorMiscElementMixin
// 适配屏幕大小展示
editor.fitZoom
```

<br>

---

## MODULES - templetJSON
完整的模板JSON数据

<br>

---

## MODULES - editorDefaults
数据模型相关字段详细说明
```json
{
    border: {...},
    backgroundEffect: {...},
    element: {...},
    groupElement: {...},
    textElement: {...},
    textEffect: {...},
    ...
}
```

<br>

---

## MODULES - editorOptions
编辑器的配置参数, 例如以 `VUE` 组件方式调用时
```
<editor refs="editor" :options="editorOptions" />
```
```
console.log(editor.options)
```