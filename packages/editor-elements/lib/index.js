import elements from "./lazy";
export * from "./i18n";
export default Object.keys(elements).reduce(function (obj, type) {
  obj[type] = elements[type]();
  return obj;
}, {});