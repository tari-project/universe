import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const Wrapper = styled(Box)`
    pointer-events: none;

    position: absolute;
    bottom: 20px;
    left: 50%;
    z-index: 2;
    transform: translateX(-50%);
`;
