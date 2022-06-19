export interface IAuthKeyOption {
    start_time: number;
    end_time: number;
    auth_key: string;
    effective_time: number;
}
export declare type TGetAuthKey = () => Promise<Pick<IAuthKeyOption, 'auth_key' | 'effective_time'> | null>;
export declare class PrivateAssets {
    private storeKey;
    private cachePromise;
    private cacheResult;
    private getAuthKey;
    component: any;
    constructor(getAuthKey: TGetAuthKey, storeKey?: string);
    getPrivateKey(force?: boolean): Promise<string | null>;
    getPrivateUrl(url: string, force?: boolean): Promise<string>;
}
