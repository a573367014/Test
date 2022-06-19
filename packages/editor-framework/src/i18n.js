import { createVueI18n } from '@gaoding/vue-i18next';
import cn from '../locales/zh-CN.json';
import en from '../locales/en.json';
import id from '../locales/id.json';
import ptBR from '../locales/pt-BR.json';

export const { i18n } = createVueI18n('editor-framework');

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
