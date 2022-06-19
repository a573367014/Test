export enum DriverConsts {
    // positions
    Center = 'Center',
    Left = 'Left',
    TopLeft = 'TopLeft',
    Top = 'Top',
    TopRight = 'TopRight',
    Right = 'Right',
    BottomRight = 'BottomRight',
    Bottom = 'Bottom',
    BottomLeft = 'BottomLeft',

    // targets
    Layout = 'Layout',
    FirstElement = 'FirstElement',
    LastElement = 'LastElement',
    TopElement = 'TopElement',
    BottomElement = 'BottomElement',
    CurrentElement = 'CurrentElement',
}

export const ROTATE_ICON_OFFSET = 25;

export const IS_CYPRESS = !!('cy' in window);
