import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export type MiningTimeVariant = 'primary' | 'mini';

export const Wrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    flex-direction: column;
    justify-content: space-between;
    border-radius: 10px;
    padding: 15px;
    width: 50%;
`;

export const HeadingSection = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
`;
export const Heading = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.text.secondary};
    font-weight: 500;
`;

export const MiniWrapper = styled.div`
    width: 100%;
    gap: 3px;
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.palette.text.contrast};
    background-color: ${({ theme }) => theme.palette.contrast};
    padding: 4px 7px;
    border-radius: 50px;
    line-height: 1;
    font-size: 11px;
    font-weight: 700;
    height: 16px;
`;

export const TimerDot = styled.div`
    border-radius: 50%;
    background-color: #33cd7e;
    width: 7px;
    height: 7px;
`;
export const TimerUnitWrapper = styled.div<{ $variant?: MiningTimeVariant }>`
    ${({ $variant }) => {
        switch ($variant) {
            case 'mini': {
                return css``;
            }
            case 'primary':
            default: {
                return css`
                    margin-right: 4px;
                `;
            }
        }
    }}
`;
export const TimerTextWrapper = styled.div<{ $variant?: MiningTimeVariant }>`
    display: flex;
    align-items: baseline;

    ${({ $variant }) => {
        switch ($variant) {
            case 'mini': {
                return css`
                    gap: 0.05ch;
                    font-size: 11px;
                    font-weight: 700;
                `;
            }
            case 'primary':
            default: {
                return css`
                    font-size: 18px;
                    font-weight: 500;
                `;
            }
        }
    }}
`;

export const SpacedNum = styled(Typography)`
    font-variant-numeric: tabular-nums;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1ch;
`;
