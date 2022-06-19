interface IFilterInfo {
    strong: number;
    intensity?: number;
    [key: string]: any;
}

/**
 * 获取滤镜强度
 */
export declare function getFilterIntensity(filterInfo: IFilterInfo): number;
/**
 * 设置滤镜强度
 */
export declare function setFilterIntensity(intensity: number, filterInfo: number): void;
