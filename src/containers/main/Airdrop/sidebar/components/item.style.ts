import styled from 'styled-components';
import * as m from 'motion/react-m';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
`;

export const ActionWrapper = styled.div`
    flex-direction: column;
    display: grid;
    place-content: center;
    place-items: center;
    grid-template-columns: 60px;
    grid-template-rows: repeat(auto-fill, minmax(35px, auto));
    border-radius: 12px;
    position: relative;
    gap: 4px;
    height: 60px;
    width: 60px;

    &:hover,
    &:focus {
        box-shadow: ${({ theme }) => `${convertHexToRGBA(theme.palette.contrast, 0.03)} 0 0 2px 2px`};
        outline: none;
    }
`;

export const ActionText = styled(Typography)<{ $isWrapped?: boolean }>`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 10px;
    line-height: 1;
    font-weight: 600;
    text-transform: ${({ $isWrapped }) => ($isWrapped ? `capitalize` : 'uppercase')};
    text-align: center;
    padding: 0 0 6px;
`;

export const ActionHoveredWrapper = styled.div`
    position: absolute;
    z-index: 10;
`;

export const TooltipBox = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.tooltip};
    box-shadow: 0 3px 25px 0 rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    padding: 20px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    z-index: 20;
    width: max-content;

    max-width: 220px;

    h6 {
        line-height: 1.2;
        margin-bottom: 2px;
    }
`;
