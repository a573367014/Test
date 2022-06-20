import { compatibleOldVersion } from './compatible-old-version';

describe('utils/compatibleOldVersion', () => {
    test('兼容测试', () => {
        expect(compatibleOldVersion(497090)).toEqual({
            url: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20210403-230258-00ff.zip',
            id: '48164400',
        });

        expect(compatibleOldVersion('497090')).toEqual({
            url: 'https://st-gdx.dancf.com/gaodingx/0/illusion/20210403-230258-00ff.zip',
            id: '48164400',
        });

        expect(compatibleOldVersion(91)).toBeUndefined();
    });
});
