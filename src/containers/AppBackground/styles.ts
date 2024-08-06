import { styled, type Theme } from '@mui/material/styles';
import { Box } from '@mui/material';

export const AppContainer = styled(Box)(
    ({ theme, status }: { theme: Theme; status: string }) => ({
        backgroundColor: theme.palette.background.default,
        backgroundSize: 'cover',
        backgroundImage: `url(${status})`,
        backgroundPosition: 'center',
    })
);
