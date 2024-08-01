import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

export const AppContainer = styled(Box)(
  ({ theme, status }: { theme: any; status: any }) => ({
    backgroundColor: theme.palette.background.default,
    backgroundSize: 'cover',
    backgroundImage: `url(${status})`,
    backgroundPosition: 'center',
  })
);
