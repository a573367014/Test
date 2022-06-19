import { localCache } from '@gaoding/cache';
import { getPrivateUrl } from './util';
import Component from './component.vue';

export interface IAuthKeyOption {
    start_time: number;
    end_time: number;
    auth_key: string;
    effective_time: number;
}
export type TGetAuthKey = () => Promise<Pick<IAuthKeyOption, 'auth_key' | 'effective_time'> | null>;

export class PrivateAssets {
    private storeKey: string;
    private cachePromise: null | ReturnType<TGetAuthKey> = null;
    private cacheResult: IAuthKeyOption;
    private getAuthKey: TGetAuthKey;
    component: any;

    constructor(getAuthKey: TGetAuthKey, storeKey = 'PRIVATE_FILEMS_URL_CACHE_KEY') {
        const createComponent = (Component: any) => {
            return {
                ...Component,
                props: {
                    ...Component.props,
                    getPrivateKey: {
                        ...Component.props.getPrivateKey,
                        default: this.getPrivateKey.bind(this),
                    },
                },
            };
        };

        this.getAuthKey = getAuthKey;
        this.storeKey = storeKey;
        this.cacheResult = localCache.get(storeKey);
        this.component = createComponent(Component);
    }

    async getPrivateKey(force = false) {
        const now = new Date().getTime();

        if (force || !this.cacheResult || this.cacheResult.end_time - now < 60 * 1000) {
            this.cachePromise = (this.cachePromise || this.getAuthKey()) as ReturnType<TGetAuthKey>;

            const res = await this.cachePromise;
            this.cachePromise = null;

            if (!res) {
                return null;
            }

            this.cacheResult = res as IAuthKeyOption;
            this.cacheResult.start_time = new Date().getTime();
            this.cacheResult.end_time =
                this.cacheResult.start_time + this.cacheResult.effective_time * 1000;
            localCache.set(this.storeKey, this.cacheResult, { time: -1 });
        }

        return this.cacheResult.auth_key;
    }

    async getPrivateUrl(url: string, force = false) {
        await this.getPrivateKey(force);
        return getPrivateUrl(url, this.cacheResult.auth_key);
    }
}
