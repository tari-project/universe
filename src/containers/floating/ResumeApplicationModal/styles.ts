import { Stack } from '@app/components/elements/Stack';
import { Typography } from '@app/components/elements/Typography';
import styled from 'styled-components';

export const Wrapper = styled(Stack)`
    width: 360px;
    padding: 10px 20px;
    background: #fff;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
    position: fixed;
    bottom: 20px;
    right: 0;
    left: 0;
    margin: auto;
    z-index: 10;
`;

export const TextWrapper = styled(Stack)`
    flex-direction: column;
    align-items: flex-start;
`;

export const ProgressWrapper = styled(Stack)`
    gap: 10px;
    flex-direction: row;
    align-items: center;
`;

export const Title = styled(Typography)`
    color: #000;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 150%;
    letter-spacing: -0.4px;
`;

export const Text = styled(Typography)`
    color: #000;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%;
    letter-spacing: -0.4px;
`;
