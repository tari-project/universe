import { ReactNode } from 'react';
import { useTheme } from '@mui/material/styles';
import clouds from '../../assets/backgrounds/clouds.png';
import loading from '../../assets/backgrounds/loading.jpg';
import determining from '../../assets/backgrounds/determining.jpg';
import loser from '../../assets/backgrounds/loser.jpg';
import winner from '../../assets/backgrounds/winner.jpg';
import { backgroundType } from '../../store/types';

import { AppContainer } from './styles';

function AppBackground({
    children,
    status,
}: {
    children: ReactNode;
    status: backgroundType;
}) {
    const theme = useTheme();
    let bg: string;

    switch (status) {
        case 'onboarding':
            bg = clouds;
            break;
        case 'determining':
            bg = determining;
            break;
        case 'loading':
            bg = loading;
            break;
        // case 'mining':
        //     bg = mining;
        //     break;
        case 'loser':
            bg = loser;
            break;
        case 'winner':
            bg = winner;
            break;
        case 'mining':
        case 'idle':
        default:
            bg = clouds;
            break;
    }

    return (
        <AppContainer theme={theme} status={bg || loading}>
            {children}
        </AppContainer>
    );
}

export default AppBackground;
