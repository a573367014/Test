import type { ElementModel, ILayoutModel } from '../../types/editor';
export declare function getUrlKeys(element: Partial<ElementModel | ILayoutModel>): string[];
export declare const PLACEHOLDER_PROTOCOL = "placeholder://";
export declare function isPlacehoderUrl(url: string): boolean;
export declare function isLocalUrl(url: string): boolean;
export declare function checkDataUrl(props: Partial<ElementModel | ILayoutModel>, callback: (key: string, url: string) => void): void;
