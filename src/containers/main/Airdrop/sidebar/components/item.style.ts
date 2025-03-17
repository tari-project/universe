import styled from 'styled-components';
import * as m from 'motion/react-m';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

export const ContentWrapper = styled.div`
    width: 50px;
    height: 40px;
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

export const ActionWrapper = styled.div`
    flex-direction: column;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    flex-shrink: 0;
    position: relative;
    cursor: pointer;
    height: 60px;
    width: 60px;

    &:hover {
        box-shadow: ${({ theme }) => `${convertHexToRGBA(theme.palette.contrast, 0.03)} 0 0 2px 2px`};
    }
`;

export const ActionText = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
`;

export const ActionHoveredWrapper = styled(m.div).attrs({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
})`
    background: ${({ theme }) => theme.palette.background.main};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 10px;
    padding: 10px;
    z-index: 20;
`;
