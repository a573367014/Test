import _createClass from "@babel/runtime/helpers/createClass";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import BaseModel from "@gaoding/editor-framework/lib/base/element-base-model";
import { hexaToRgba } from "@gaoding/editor-framework/lib/utils/model-adaptation";
import { fitArrowTrunk } from "@gaoding/editor-framework/lib/utils/fit-elements";

var arrowModel = /*#__PURE__*/function (_BaseModel) {
  _inheritsLoose(arrowModel, _BaseModel);

  function arrowModel(data) {
    var _this;

    _this = _BaseModel.call(this, data) || this;
    _this.color = hexaToRgba(_this.color);

    if (_this.$originalScale === null) {
      var minScale = Math.min(1, _this.width / _this.minWidth);
      var scale = _this.height / minScale / Math.max(_this.head.height + _this.head.top, _this.tail.height + _this.tail.top, _this.trunk.height + _this.trunk.top);
      _this.$originalScale = scale.toFixed(2) - 0;
    }

    fitArrowTrunk(_assertThisInitialized(_this));
    delete _this.originalScale;
    return _this;
  }

  _createClass(arrowModel, [{
    key: "$headLeft",
    get: function get() {
      var tail = this.tail,
          head = this.head;
      var $originalScale = this.$originalScale || 1;
      var minWidth = this.minWidth;
      var modelWidth = this.width / $originalScale;
      var trunkWidth = Math.max(minWidth, modelWidth) - (tail.left + tail.width + head.width);
      return this.trunk.left + trunkWidth;
    }
  }, {
    key: "$trunkWidth",
    get: function get() {
      var tail = this.tail,
          head = this.head,
          trunk = this.trunk;
      var $originalScale = this.$originalScale || 1;
      var minWidth = this.minWidth;
      var modelWidth = this.width / $originalScale;
      var trunkWidth = Math.max(minWidth, modelWidth) - (tail.left + tail.width + head.width);
      var trunkInHeadWidth = trunk.left + trunk.width - head.left;
      return Math.max(0, trunkWidth + trunkInHeadWidth);
    }
  }]);

  return arrowModel;
}(BaseModel);

export default arrowModel;