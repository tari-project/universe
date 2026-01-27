import { m } from 'motion/react';
import styled from 'styled-components';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { convertHexToRGBA } from '@app/utils';

export const SidebarWrapper = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    padding: 12px;
    width: ${SB_WIDTH}px;
    position: relative;
`;

export const SidebarContent = styled.div`
    display: flex;
    height: 100%;
    flex-direction: column;
    justify-content: space-between;
    gap: 20px;

    & * {
        pointer-events: auto;
    }
`;

export const SwapsOverlay = styled(m.div)`
    background: ${({ theme }) => convertHexToRGBA(theme.mode === 'dark' ? '#1e1e1a' : '#000', 0.5)};
    backdrop-filter: blur(0.03rem);
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 4;
    top: 0;
    left: 0;
    border-radius: 20px;
`;
