import { MOVE_CLASS_PROP } from '../utils/constants';

export interface IOptions {
    align: string | undefined;
    line: string | undefined;
    lineGap: number;
    maxLineGap: number;
    minLineGap: number;
    singleMaxWidth: number;
    fixedHeight: boolean | undefined;
    flex: number[] | undefined;
}

export interface IProps {
    autoResize: boolean;
    interval: number;
    align: string;
    line: string;
    lineGap: number;
    minLineGap: number;
    maxLineGap: number;
    singleMaxWidth: number;
    fixedHeight: boolean;
    flex: number[];
    watchTarget: any[];
}
export interface IRect {
    /**
     * 高度
     */
    height: number;
    /**
     * 左边距
     */
    left: number;
    /**
     * 上边距
     */
    top: number;
    /**
     * 宽度
     */
    width: number;
}
export interface IMeta {
    rect: {
        detail: IRect;
    };
    node: HTMLElement & { [MOVE_CLASS_PROP]?: string };
    order: number;
    width: number;
    height: number;
    moveClass: string;
}
export type MetaList = IMeta[];
export type RectList = IRect[];
