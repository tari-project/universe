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

    &:hover {
        box-shadow: ${({ theme }) => `${convertHexToRGBA(theme.palette.contrast, 0.03)} 0 0 2px 2px`};
    }
`;

export const ActionText = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 10px;
    line-height: 0.95;
    font-weight: 600;
    text-transform: uppercase;
    text-align: center;
    padding: 0 0 6px;
`;

export const ActionHoveredWrapper = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.main};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    height: 60px;
    padding: 10px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    z-index: 20;
    width: max-content;
`;
