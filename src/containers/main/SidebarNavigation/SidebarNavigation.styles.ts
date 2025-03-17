import * as m from 'motion/react-m';
import styled from 'styled-components';

import { SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';

export const SidebarNavigationWrapper = styled(m.div)`
    height: 100%;
    display: flex;
    gap: ${SB_SPACING}px;
    pointer-events: all;
    z-index: 10;
`;

export const SidebarGrid = styled.div`
    height: 100%;
    position: relative;
    justify-items: stretch;
    display: flex;
`;

const variants = {
    open: { opacity: 1, left: 0, transition: { duration: 0.2, ease: 'linear' } },
    closed: { opacity: 0, left: -50, transition: { duration: 0.05, ease: 'linear' } },
};

export const SidebarWrapper = styled(m.div).attrs({
    variants,
    initial: 'closed',
    animate: 'open',
    exit: 'closed',
})<{ $isMiniBar?: boolean }>`
    pointer-events: all;
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    border-radius: 20px;
    height: 100%;
    flex-shrink: 0;
    padding: 20px;
    position: relative;
    width: ${SB_WIDTH}px;

    & * {
        pointer-events: all;
    }
`;
