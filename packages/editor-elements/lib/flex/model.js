import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import merge from 'lodash/merge';
import EditorDefaults from "@gaoding/editor-framework/lib/base/editor-defaults";
import GroupModel from "../group/model";

var FlexModel = /*#__PURE__*/function (_GroupModel) {
  _inheritsLoose(FlexModel, _GroupModel);

  function FlexModel(data) {
    var _this;

    _this = _GroupModel.call(this, data) || this;
    data.elements.forEach(function (element) {
      element.flex = merge({}, EditorDefaults.flex, element.flex);
    });
    return _this;
  }

  return FlexModel;
}(GroupModel);

export default FlexModel;