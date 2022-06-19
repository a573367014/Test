import model from "./model";
import methods from "./methods";
import MaskElement from "./mask-element";
import MaskEditor from "@gaoding/editor-framework/lib/static/mask-editor";
export default {
  model: model,
  methods: methods,
  layoutComponent: MaskElement,
  editComponent: MaskEditor
};