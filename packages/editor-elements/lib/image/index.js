import model from "./model";
import methods from "./methods";
import ImageElement from "./image-element";
import MaskEditor from "@gaoding/editor-framework/lib/static/mask-editor";
export default {
  model: model,
  methods: methods,
  layoutComponent: ImageElement,
  editComponent: MaskEditor
};