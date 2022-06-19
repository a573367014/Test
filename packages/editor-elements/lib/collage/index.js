import model from "./model";
import CollageElement from "./collage-element";
import methods from "./methods";
import CollageEditor from "./collage-editor";
export default {
  model: model,
  methods: methods,
  layoutComponent: CollageElement,
  editComponent: CollageEditor
};