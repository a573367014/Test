import { ITextEffect } from './effect';
import { IElement } from './element';
import { IAggregatedColors } from './general';
import { IBaseShadow } from './shadow/base-shadow';

export interface ITextElement extends IElement {
    type: 'text';
    color: string;
    backgroundColor: null | string;
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    fontStyle: string;
    lineHeight: number;
    letterSpacing: number;
    textAlign: string;
    verticalAlign: string;
    textDecoration: string;
    writingMode: string;
    content: string;
    contents: null | Content[];
    aggregatedColors: IAggregatedColors;
    mainColor: null;
    textEffects: ITextEffect[];
    shadows: IBaseShadow[];
    /**
     * 宽、高是否自增
     * 0b00不自增、0b01高度自增、0b10宽度自增、0b11宽高同时自增
     */
    autoAdaptive: number;

    // unknown
    textShadow: null;
    autoScale: boolean;
    listStyle: string;
    ruleIndex: number;
}

export interface Content {
    fontFamily: string;
    fontStyle: string;
    fontSize: number;
    fontWeight: number;
    textDecoration: string;
    content: string;
}
