/**
 * @class EditorWatermarkElementMixin
 * @description 元素的专属方法
 */
import EditorDefault from "@gaoding/editor-framework/lib/base/editor-defaults";
import cloneDeep from 'lodash/cloneDeep';
import Transform from "@gaoding/editor-utils/lib/transform";
import { logoPropsToImageProps, titlePropsToTextProps, infoPropsToTextProps, infoPropsToImageProps, isTextElement, changeTextColor, changeImageColor } from "./utils";
import { isGroup } from "@gaoding/editor-utils/lib/element"; // 检查导入的模板元素是否已经加载

function autoImportSyncComponent(template, editor) {
  var supportTypes = editor.supportTypes;
  var types = supportTypes.includes('group') ? [] : ['group'];
  editor.walkTemplet(function (element) {
    var type = element.type;

    if (!supportTypes.includes(type) && !types.includes(type)) {
      types.push(type);
    }
  }, true, [template]);
  return Promise.all(types.map(function (type) {
    return editor.createAsyncComponent({
      type: type
    });
  }));
}

export default {
  /**
   * 设置水印中的模板
   * @memberof EditorWatermarkElementMixin
   * @param { Element } template - 水印的模板
   * @param { Element } element - 设置模板的水印元素
   */
  setWatermarkTemplate: function setWatermarkTemplate(template, element) {
    var _this = this;

    element = this.getElement(element);

    if (!element || element.type !== 'watermark') {
      return;
    }

    return autoImportSyncComponent(template, this).then(function () {
      template = _this.createElement(cloneDeep(template));
      template.$parentId = element.$id; // 需要根据当前水印的拉伸比例修改模板的尺寸

      template.left = 0;
      template.top = 0;
      var ratio = element.template.width / template.width;
      element.cellWidth = element.template.width = template.width * ratio;
      element.cellHeight = element.template.height = template.height * ratio;

      if (element.waterType === 0) {
        element.width = template.width * ratio;
        element.height = template.height * ratio;
      }

      return _this.resizeElements([template], ratio).then(function () {
        var _element = element,
            logo = _element.logo,
            title = _element.title,
            $logoModel = _element.$logoModel,
            aggregatedColors = _element.aggregatedColors,
            fontFamily = _element.fontFamily,
            fontWeight = _element.fontWeight,
            fontStyle = _element.fontStyle;
        var color;

        if (aggregatedColors) {
          color = {};
          aggregatedColors.forEach(function (c) {
            color[c.key] = c.color;
          });
        }

        element.setTemplate(template);

        if (logo && $logoModel) {
          Object.assign(element.$logoModel, {
            $renderId: $logoModel.$renderId,
            url: $logoModel.url,
            imageTransform: $logoModel.parseTransform($logoModel.imageTransform),
            naturalWidth: $logoModel.naturalWidth,
            naturalHeight: $logoModel.naturalHeight
          });
        }

        _this.changeWatermark({
          logo: logo,
          title: title,
          color: color,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontStyle: fontStyle
        }, element);

        _this.makeSnapshot('change_watermark_template');
      });
    });
  },

  /**
   * 修改水印元素属性
   * @memberof EditorWatermarkElementMixin
   * @param {Object} props 多个属性对象
   * @param {WatermarkElement} element 水印元素
   * @param {boolean} makeSnapshot 保存快照
   */
  changeWatermark: function changeWatermark(props, element, makeSnapshot) {
    var _this2 = this;

    if (makeSnapshot === void 0) {
      makeSnapshot = true;
    }

    element = this.getElement(element);

    if (!element || element.type !== 'watermark') {
      return;
    }

    var needRender = false;
    var logoProps = element.$logoModel && logoPropsToImageProps(props);
    var titleProps = element.$titleModel && titlePropsToTextProps(props);
    var infoTextProps = element.$infoModels.length > 0 && infoPropsToTextProps(props, element.$infoModels);
    var infoImageProps = element.$infoModels.length > 0 && infoPropsToImageProps(props, element.$infoModels); // const backgroundProps = element.$backgroundModel && backgroundPropsToImageProps(props, element.$backgroundModel);

    if (logoProps) {
      this.changeElement(logoProps, [element.$logoModel], false);
      needRender = true;
    }

    if (titleProps) {
      this.changeElement(titleProps, [element.$titleModel], false);
      needRender = true;
    }

    if (infoTextProps) {
      infoTextProps.forEach(function (infoProp, index) {
        if (infoProp) {
          var textModel = element.$infoModels[index];

          if (isGroup(textModel)) {
            textModel = textModel.elements.find(function (model) {
              return isTextElement(model);
            });
          }

          if (isTextElement(textModel)) {
            _this2.changeElement(infoProp, [textModel], false);
          }

          needRender = true;
        }
      });
    }

    if (infoImageProps) {
      infoImageProps.forEach(function (infoProp, index) {
        if (infoProp) {
          var imageModel = element.$infoModels[index];

          if (isGroup(imageModel)) {
            imageModel = imageModel.elements.find(function (model) {
              return model.type === 'image' || model.type === 'mask' || model.type === 'svg';
            });
          }

          if (imageModel) {
            _this2.changeElement(infoProp, [imageModel], false);
          }

          needRender = true;
        }
      });
    }

    if (props.color) {
      var keys = Object.keys(props.color);

      if (keys.some(function (key) {
        return ['textColor', 'effectColor'].includes(key);
      })) {
        var _props$color = props.color,
            textColor = _props$color.textColor,
            effectColor = _props$color.effectColor;
        element.$textModels.forEach(function (textModel) {
          if (textModel.colorChange) {
            changeTextColor(textColor, effectColor, textModel, _this2);
          }
        });
      }

      if (keys.some(function (key) {
        return ['effect', 'effectColor', 'textColor'].includes(key);
      })) {
        var _props$color2 = props.color,
            effect = _props$color2.effect,
            _effectColor = _props$color2.effectColor,
            _textColor = _props$color2.textColor;
        element.$effectModels.forEach(function (effectModel) {
          if (effectModel.colorChange) {
            if (effectModel.category === 'ICON') {
              changeImageColor(null, _textColor, effectModel, _this2);
            } else {
              changeImageColor(effect, _effectColor, effectModel, _this2);
            }
          }
        });
      }

      if (element.$backgroundModel && keys.some(function (key) {
        return ['backgroundImage', 'backgroundColor'].includes(key);
      })) {
        var _props$color3 = props.color,
            backgroundImage = _props$color3.backgroundImage,
            backgroundColor = _props$color3.backgroundColor;
        changeImageColor(backgroundImage, backgroundColor, element.$backgroundModel, this);
      }

      needRender = true;
    }

    if (needRender) {
      element.$renderVersion += 1;
    }

    makeSnapshot && this.makeSnapshot('change_element');
  },

  /**
   * 修改水印元素的 logo 图片地址
   * @memberof EditorWatermarkElementMixin
   * @param { String } url - 图片地址
   * @param { Element } element - 水印元素
   */
  changeWatermarkLogo: function changeWatermarkLogo(url, _ref, element) {
    var width = _ref.width,
        height = _ref.height;
    element = this.getElement(element);

    if (!element || element.type !== 'watermark') {
      return;
    }

    this.replaceImage(url, {
      forwardEdit: element.waterType !== 1,
      width: width,
      height: height
    }, element.$logoModel, false);
    this.changeElement({
      logo: {
        url: url
      }
    }, element, false);
    this.makeSnapshot('change_watermark_logo');
  },
  flipWatermarkLogo: function flipWatermarkLogo(dir, element) {
    element = this.getElement(element);

    if (!element || element.type !== 'watermark') {
      return;
    }

    this.flipElement(dir, element.$logoModel);
    this.$events.$emit('element.watermarkUpdated', element, true);
  },

  /**
   * 通过组元素创建水印元素
   * @memberof EditorWatermarkElementMixin
   * @param { GroupElement } - 组元素
   * @param { Object } - 水印元素的基本配置
   */
  createWatermarkByGroup: function createWatermarkByGroup(groupElement, options) {
    if (!isGroup(groupElement)) {
      return {};
    }

    var element = cloneDeep(groupElement);
    delete element.uuid;
    delete element.$id;
    var watermark = Object.assign({
      type: 'watermark'
    }, cloneDeep(EditorDefault.watermarkElement), options);
    watermark.cellWidth = element.width;
    watermark.cellHeight = element.height;
    watermark.cellTop = element.top;
    watermark.cellLeft = element.left;

    if (watermark.waterType === 0) {
      watermark.width = watermark.cellWidth = element.width;
      watermark.height = watermark.cellHeight = element.height;
      watermark.left = element.left;
      watermark.top = element.top;
    }

    element.left = 0;
    element.top = 0;
    watermark.template = element;
    return this.createElement(watermark);
  },

  /**
   * 全屏水印进入编辑状态
   * @memberof EditorWatermarkElementMixin
   * @param { Element } element
   */
  showWatermarkEditor: function showWatermarkEditor(element) {
    element = this.getElement(element);

    if (element.type !== 'watermark' || element.waterType !== 1) {
      return;
    }

    this.currentEditWatermark = element;
  },

  /**
   * 退出全屏水印编辑状态
   * @memberof EditorWatermarkElementMixin
   */
  hideWatermarkEditor: function hideWatermarkEditor() {
    this.currentEditWatermark = null;
  },

  /**
   * 设置水印类型
   * @memberof EditorWatermarkElementMixin
   * @param { Number } waterType 1 全屏水印 0 常规水印
   * @param { element } element 水印元素
   * @param { layout } layout layout
   */
  setWatermarkType: function setWatermarkType(waterType, element, layout) {
    element = this.getElement(element);

    if (!element || element.type !== 'watermark') {
      return;
    }

    if (waterType === 1) {
      if (!layout) {
        layout = this.getLayoutByElement(element) || this.currentLayout;
      }

      var _layout = layout,
          width = _layout.width,
          height = _layout.height;
      this.changeElement({
        width: width,
        height: height,
        top: 0,
        left: 0,
        dragable: false,
        rotatable: false,
        transform: element.parseTransform(new Transform()),
        resize: 0,
        waterType: waterType
      }, element);
    } else {
      var _element2 = element,
          _element2$template = _element2.template,
          _width = _element2$template.width,
          _height = _element2$template.height,
          cellLeft = _element2.cellLeft,
          cellTop = _element2.cellTop,
          cellTransform = _element2.cellTransform;
      this.changeElement({
        cellWidth: _width,
        cellHeight: _height,
        left: cellLeft,
        top: cellTop,
        width: _width,
        height: _height,
        rotatable: true,
        dragable: true,
        transform: cellTransform,
        resize: 1,
        imageUrl: '',
        imageWidth: 0,
        imageHeight: 0,
        waterType: waterType
      });
    }
  }
};