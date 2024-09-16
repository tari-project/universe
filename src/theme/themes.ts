import { light, dark, componentSettings } from './tokens';
import { DefaultTheme } from 'styled-components';

const lightTheme: DefaultTheme = {
    ...light,
    ...componentSettings,
};

const darkTheme: DefaultTheme = {
    ...dark,
    ...componentSettings,
};

export { lightTheme, darkTheme };
