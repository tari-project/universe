import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

interface CountdownProps {
    $compact?: boolean;
}
export const CountdownWrapper = styled.div<CountdownProps>`
    display: flex;
    align-items: stretch;
    justify-content: ${({ $compact }) => ($compact ? 'flex-start' : 'center')};
    align-self: center;
    gap: 3px;
    width: 100%;
    flex-wrap: wrap;
`;
export const CountdownText = styled(Typography).attrs({ variant: 'p' })<CountdownProps>`
    display: flex;
    letter-spacing: -0.3px;
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    line-height: 1;
    color: ${({ theme }) => theme.palette.text.wisp};

    strong {
        font-weight: 600;
    }

    ${({ $compact }) =>
        $compact &&
        css`
            color: ${({ theme }) => theme.palette.text.accent};
            font-size: 12px;
            font-weight: 500;
            line-height: 1.2;

            strong {
                font-weight: 700;
            }
        `};
`;
