import { useTheme } from '@mui/material/styles';

import { BackgroundImage } from './styles';
import { useUIStore } from '@app/store/useUIStore.ts';
function AppBackground() {
    const theme = useTheme();
    const visualMode = useUIStore((s) => s.visualMode);

    return !visualMode ? <BackgroundImage theme={theme} /> : null;
}

export default AppBackground;
