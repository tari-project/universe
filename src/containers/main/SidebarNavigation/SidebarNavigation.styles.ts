import * as m from 'motion/react-m';
import styled from 'styled-components';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { convertHexToRGBA } from '@app/utils';

export const SidebarWrapper = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    border-radius: 20px;
    position: relative;
    height: 100%;
    overflow: hidden;
    pointer-events: all;
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
