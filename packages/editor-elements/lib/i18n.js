import { createVueI18n } from '@gaoding/vue-i18next';
import cn from "./locales/zh-CN.json";
import en from "./locales/en.json";
import id from "./locales/id.json";
import ptBR from "./locales/pt-BR.json";

var _createVueI18n = createVueI18n('editor-elements'),
    i18n = _createVueI18n.i18n;

export { i18n };
i18n.init({
  language: 'zh-CN',
  fallbackLanguage: 'en',
  resources: {
    'zh-CN': cn,
    id: id,
    pt: ptBR,
    en: en
  }
});
export function changeLanguage(lang) {
  i18n.changeLanguage(lang);
}