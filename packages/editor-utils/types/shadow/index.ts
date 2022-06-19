import { IBaseShadow } from './base-shadow';
import { IContactShadow } from './contact-shadow';
import { IParallelShadow } from './parallel-shadow';
import { IReflectShadow } from './reflect-shadow';
import { ISkewShadow } from './skew-shadow';

/**
 * 投影
 */
export type IShadow = IBaseShadow | IParallelShadow | ISkewShadow | IContactShadow | IReflectShadow;
