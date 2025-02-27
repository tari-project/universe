import * as m from 'motion/react-m';
import styled from 'styled-components';
import { convertHexToRGBA } from '@app/utils';
import { SB_SPACING } from '@app/theme/styles.ts';

export const SidebarNavigationWrapper = styled(m.div)`
    height: 100%;
    position: relative;
    display: flex;
    gap: ${SB_SPACING}px;
`;

export const SidebarWrapper = styled(m.div)`
    pointer-events: all;
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    border-radius: 20px;
    height: 100%;
    position: relative;
    overflow: hidden;
`;

export const SidebarCover = styled(m.div)`
    position: absolute;
    inset: 0;
    z-index: 1;
    background: ${({ theme }) => convertHexToRGBA(theme.colors.grey[theme.mode === 'dark' ? 950 : 900], 0.3)};
    cursor: pointer;
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
`;
