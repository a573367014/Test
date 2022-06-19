import { IColor } from './color-picker';

export interface GradientPickerHTMLElement extends HTMLElement {
    setCurrentStepColor(color: IColor): void;
}
