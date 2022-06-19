import model from "./model";
import methods from "./methods";
import VideoElement from "./video-element";
import MaskEditor from "@gaoding/editor-framework/lib/static/mask-editor";
export default {
  model: model,
  methods: methods,
  layoutComponent: VideoElement,
  editComponent: MaskEditor
};