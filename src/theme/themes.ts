import { createTheme } from '@mui/material/styles';
import { light, dark, componentSettings } from './tokens';

const lightTheme = createTheme({
  ...light,
  ...componentSettings,
});

const darkTheme = createTheme({
  ...dark,
  ...componentSettings,
});

export { lightTheme, darkTheme };
