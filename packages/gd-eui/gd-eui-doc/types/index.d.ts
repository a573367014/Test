import { TypesContext } from '../core/types-context';

export type IComments = Record<string, string[]> & {
    default?: string[];
};

export interface ITypeComment {
    type?: string;
    name?: string;
    desc?: string;
}

export interface IParamComment extends ITypeComment {
    paramsStr?: string;
}

export interface IMarkDownData {
    content: string;
}

export interface ITitleTagData {
    title?: string;
    desc?: string;
    dots?: string[];
}

export interface IPropertyData {
    name?: string;
    type?: string;
    defaultValue?: string;
    require?: boolean;
    desc?: string;
}

export interface IEmitesData {
    name?: string;
    desc?: string;
    params?: ITypeComment[];
}

export interface IFunctionData {
    name?: string;
    desc?: string;
    returnType?: string;
    functionStr?: string;
    params?: IParamComment[];
}

export interface ITypeContextItem {
    importSpecifiers: string[];
    source: string;
    context: TypesContext;
}

export interface ITypeObj {
    name: string;
    type: string; // 'enum' | 'interface' | 'type' | ……
    comment: string;
    isOptional: boolean;
    defaultValue?: string;
    children?: ITypeObj[];
    parameters?: ITypeObj[];
    returns?: string;
    sources?: [];
    method?: ITypeObj;
    variable?: ITypeObj;
}

export interface ISlotData {
    name: string;
    desc?: string;
}
