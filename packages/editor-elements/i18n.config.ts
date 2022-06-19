import { defineI18nConfig } from '@gaoding/i18n';

export default defineI18nConfig({
    localesDir: 'locales',
    sourceLanguage: 'zh-CN',
    languages: ['en', 'pt-BR', 'id'],
    dirs: ['mask'],
    remoteTable: 'vika',
    vika: {
        apiToken: 'usksaeenqAsmRNTvYrmRyLs',
        datasheetId: 'dstVv6KetPRlMEQ3ds',
    },
});
