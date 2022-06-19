interface ICategoryTagItem {
    label?: string;
    value: string | number;
    title?: string;
    children?: ICategoryTagItem[];
}

export { ICategoryTagItem };
