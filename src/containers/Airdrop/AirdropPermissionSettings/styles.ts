import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

export const Wrapper = styled('div')`
    padding: 0 0 0px 0;
`;

export const BoxWrapper = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;

    padding: 20px;

    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 0px 25px 0px rgba(0, 0, 0, 0.05);
    width: 100%;

    margin-bottom: 20px;
`;

export const TextWrapper = styled(Box)`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const Title = styled('div')`
    color: #000;
    font-size: 14px;
    font-weight: 600;
    line-height: 110%;
`;

export const Text = styled(Typography)`
    color: #797979;
    font-size: 12px;
    font-weight: 500;
    line-height: 116.667%;
`;
