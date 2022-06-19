import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { serialize } from "@gaoding/editor-framework/lib/utils/utils";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";

var StyledTextModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(StyledTextModel, _BaseModel);

  function StyledTextModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;
    _this.image = Object.assign({
      url: '',
      offset: {
        x: 0,
        y: 0
      },
      width: 0,
      height: 0
    }, data.image);
    _this.effectStyle = data.effectStyle || {
      name: '',
      id: 0,
      effectFontId: 0
    };
    _this.autoScale = true;
    _this.writingMode = data.writingMode || editorDefaults.textElement.writingMode;
    _this.lineHeight = data.lineHeight || editorDefaults.textElement.lineHeight;
    _this.textAlign = data.textAlign || editorDefaults.textElement.textAlign;
    _this.letterSpacing = data.letterSpacing || editorDefaults.textElement.letterSpacing;
    _this.color = data.color || '#000';

    if (!_this.contents || !_this.contents.length) {
      _this.contents = serialize.fromJSON(_this.content || '', _assertThisInitialized(_this));
    }

    return _this;
  }

  return StyledTextModel;
}(BaseModel);

export { StyledTextModel as default };