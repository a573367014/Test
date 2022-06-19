import { IElement } from './element';
import { IImageElement } from './image';
import { ITextElement } from './text';

export interface IGroupElement extends IElement {
    type: 'group';
    /**
     * 组内的元素
     */
    elements: (IElement | IImageElement | ITextElement)[];

    /**
     * 组内文本元素尺寸变更时是否自适应
     */
    autoGrow: boolean;

    /**
     * 组合是否对用户可拆分
     */
    splitenable: boolean;
}
