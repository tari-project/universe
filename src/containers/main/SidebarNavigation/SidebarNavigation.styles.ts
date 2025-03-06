import * as m from 'motion/react-m';
import styled from 'styled-components';

import { SB_MINI_WIDTH, SB_SPACING, SB_WIDTH } from '@app/theme/styles.ts';

export const SidebarNavigationWrapper = styled(m.div)`
    height: 100%;
    display: flex;
    flex-shrink: 0;
    gap: ${SB_SPACING}px;
    pointer-events: all;
    z-index: 10;
`;

export const SidebarGrid = styled.div`
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    justify-items: stretch;
`;

const variants = {
    open: { opacity: 1, left: 0, transition: { duration: 0.3, ease: 'easeIn' } },
    closed: { opacity: 0.5, left: -50, transition: { duration: 0.05, ease: 'easeOut' } },
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
    position: relative;
    width: ${({ $isMiniBar }) => ($isMiniBar ? SB_MINI_WIDTH : SB_WIDTH)}px;

    & * {
        pointer-events: all;
    }
`;
