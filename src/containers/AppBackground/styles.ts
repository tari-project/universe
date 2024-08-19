import { styled, type Theme } from '@mui/material/styles';
import { Box } from '@mui/material';
import clouds from '../../assets/backgrounds/clouds.png';

export const BackgroundImage = styled(Box)(({ theme }: { theme: Theme }) => ({
    backgroundColor: theme.palette.background.default,
    backgroundSize: 'cover',
    backgroundImage: `url(${clouds})`,
    backgroundPosition: 'center',
    pointerEvents: 'none',
    position: 'absolute',
    height: '100%',
    width: '100%',
}));
