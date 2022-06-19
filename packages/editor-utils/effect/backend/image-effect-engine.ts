import { BaseImageEffectEngine, IEnvContext } from '../utils/base-image-effect-engine';

export class ImageEffectEngine extends BaseImageEffectEngine {
    constructor(envContext: IEnvContext) {
        super({ env: 'node', ...envContext });
    }
}
