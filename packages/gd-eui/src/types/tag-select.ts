export interface ITagItem {
    text: string;
    key?: string | number;
    disabled?: boolean;
    metaData?: Record<string, unknown>;
}

export type ITagDisabled = (tag: ITagItem) => Boolean;

export type ITags = ITagItem[];
