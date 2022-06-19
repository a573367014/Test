import { createVueI18n } from '@gaoding/vue-i18next';
import cn from './locales/zh-CN.json';
import en from './locales/en.json';
import id from './locales/id.json';
import ptBR from './locales/pt-BR.json';

export const { i18n } = createVueI18n('editor-elements');

i18n.init({
    language: 'zh-CN',
    fallbackLanguage: 'en',
    resources: {
        'zh-CN': cn,
        id,
        pt: ptBR,
        en,
    },
});

export function changeLanguage(lang) {
    i18n.changeLanguage(lang);
}
