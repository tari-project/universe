import { light, dark, componentSettings } from './tokens';

const lightTheme = {
    ...light,
    ...componentSettings,
};

const darkTheme = {
    ...dark,
    ...componentSettings,
};

export { lightTheme, darkTheme };
