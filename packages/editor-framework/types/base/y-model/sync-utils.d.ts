import * as Y from '@gaoding/yjs';
import type { ILayoutModel, ElementModel, IEditorGlobal, UID } from '../../types/editor';
import type { YElement, YLayout, YGlobal } from '../../types/y';
export declare function syncGlobalProps(yGlobal: YGlobal, props: Partial<IEditorGlobal>): void;
export declare function syncModelProps(yModel: YElement | YLayout, props: Partial<ElementModel | ILayoutModel>, setTopPropCallback?: (key: string) => void): void;
export declare function yEventToProps(event: Y.YEvent): {};
/** 校验 elements 序列是否满足 $index 的 less 关系 */
export declare function validateElements(keys: string[], ids: UID[], ignores: number[]): boolean;
/** 根据 $index 重排存在错误的元素下标 */
export declare function reorderElements(keys: string[], ids: UID[], ignores: number[]): [number[], number[]];
/** 使 uuid 与 imageUrl/effectResult 绑定 */
export declare function getSyncFallBackMethod(yModel: YElement | YLayout, element: ElementModel): (key: string) => void;
