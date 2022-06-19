import _text from "./text";
import _group from "./group";
import _mask from "./mask";
import _image from "./image";
import _svg from "./svg";
import _ninePatch from "./nine-patch";
export default {
  text: function text() {
    return Promise.resolve({
      default: _text
    });
  },
  image: function image() {
    return Promise.resolve({
      default: _image
    });
  },
  mask: function mask() {
    return Promise.resolve({
      default: _mask
    });
  },
  svg: function svg() {
    return Promise.resolve({
      default: _svg
    });
  },
  group: function group() {
    return Promise.resolve({
      default: _group
    });
  },
  ninePatch: function ninePatch() {
    return Promise.resolve({
      default: _ninePatch
    });
  },
  audio: function audio() {
    return import(
    /* webpackChunkName: "audio-element" */
    "./audio");
  },
  video: function video() {
    return import(
    /* webpackChunkName: "video-element" */
    "./video");
  },
  // styledText: () => import(/* webpackChunkName: "styled-text-element" */ './styled-text'),
  threeText: function threeText() {
    return import(
    /* webpackChunkName: "three-element" */
    "./three-text");
  },
  cell: function cell() {
    return import(
    /* webpackChunkName: "cell-element" */
    "./cell");
  },
  collage: function collage() {
    return import(
    /* webpackChunkName: "collage-element" */
    "./collage");
  },
  table: function table() {
    return import(
    /* webpackChunkName: "table-element" */
    "./table");
  },
  chart: function chart() {
    return import(
    /* webpackChunkName: "chart-element" */
    "./chart");
  },
  watermark: function watermark() {
    return import(
    /* webpackChunkName: "watermark-element" */
    "./watermark");
  },
  effectText: function effectText() {
    return import(
    /* webpackChunkName: "effect-text-element" */
    "./effect-text");
  },
  rect: function rect() {
    return import(
    /* webpackChunkName: "rect-element" */
    "./rect");
  },
  ellipse: function ellipse() {
    return import(
    /* webpackChunkName: "ellipse-element" */
    "./ellipse");
  },
  line: function line() {
    return import(
    /* webpackChunkName: "line-element" */
    "./line");
  },
  arrow: function arrow() {
    return import(
    /* webpackChunkName: "arrow-element" */
    "./arrow");
  },
  brush: function brush() {
    return import(
    /* webpackChunkName: "brush-element" */
    "./brush");
  },
  flex: function flex() {
    return import(
    /* webpackChunkName: "flex-element" */
    "./flex");
  },
  path: function path() {
    return import(
    /* webpackChunkName: "path-element" */
    "./path");
  }
};