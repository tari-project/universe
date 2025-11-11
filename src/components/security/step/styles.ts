import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';
export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    background-color: ${({ theme }) =>
        convertHexToRGBA(theme.palette.background.default, theme.mode == 'dark' ? 0.7 : 0.45)};
    padding: 20px;
    gap: 15px;
    width: 100%;
    @media (max-height: 730px) {
        gap: 8px;
        padding: 16px;
    }
`;
export const Chip = styled.div<{ $isStep?: boolean }>`
    border-radius: 50px;
    background-color: ${({ theme, $isStep }) => ($isStep ? theme.palette.contrast : theme.colors.brightRed[400])};
    color: ${({ theme, $isStep }) => ($isStep ? theme.palette.text.contrast : '#fff')};
    display: flex;
    width: max-content;
    height: 22px;
    padding: 0 8px;
    align-items: center;

    text-align: center;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
`;

export const Top = styled.div`
    display: flex;
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
`;

export const Content = styled.div`
    display: flex;
    flex-direction: column;
    grid-area: content;
`;
export const Title = styled(Typography).attrs({ variant: 'h5' })`
    display: flex;
`;
export const Subtitle = styled(Typography).attrs({ variant: 'p' })`
    display: flex;
    color: ${({ theme }) => theme.palette.text.secondary};
`;
