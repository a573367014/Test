export const EDITOR_UI_PROVIDER_KEY = Symbol('editor-ui-v2-provider');

export interface Config {
    enablePalette?: boolean;
    enableDefaultPresetColor?: boolean;

    stylePartyDisabledClass?: string;
    enableImagePanelStylePart?: boolean;
    enableBackgroundPanelStylePart?: boolean;
}

export const defaultConfig: Config = {
    enablePalette: true,
    enableDefaultPresetColor: true,
    enableImagePanelStylePart: true,
    enableBackgroundPanelStylePart: true,
};
