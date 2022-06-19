import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import _cloneDeep from "lodash/cloneDeep";
import _get from "lodash/get";
import _set from "lodash/set";
import editorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
export var WatermarkEditorModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(WatermarkEditorModel, _BaseModel);

  function WatermarkEditorModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;

    var transform = _get(data, 'template.transform', _cloneDeep(editorDefaults.element.transform));

    _set(_assertThisInitialized(_this), 'template.transform', _this.parseTransform(transform));

    return _this;
  }

  _createClass(WatermarkEditorModel, [{
    key: "scale",
    get: function get() {
      var transform = this.template.transform;
      return Math.min(transform.scale.x, transform.scale.y);
    },
    set: function set(value) {
      var transform = this.template.transform;
      transform.scale.x = value.x;
      transform.scale.y = value.y;
    }
  }]);

  return WatermarkEditorModel;
}(BaseModel);