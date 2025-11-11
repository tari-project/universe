import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';
import { SB_WIDTH } from '@app/theme/styles.ts';
import { convertHexToRGBA } from '@app/utils';

export const SidebarWrapper = styled(m.div)`
    pointer-events: all;
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    border-radius: 20px;
    height: 100%;
    flex-shrink: 0;
    padding: 13px;
    position: relative;
    width: ${SB_WIDTH}px;

    & * {
        pointer-events: all;
    }
`;

export const WrapperGrid = styled.div`
    height: 100%;
    display: flex;
    flex-flow: column;
    gap: 10px;
    justify-content: space-between;
`;

export const GridAreaTop = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 2px 0 0;
`;

export const GridAreaBottom = styled.div<{ $swapsOpen?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 4px;
    overflow: hidden;
    overflow-y: auto;
    ${({ $swapsOpen }) =>
        $swapsOpen &&
        css`
            position: absolute;
            max-height: 100%;
            height: auto;
            width: calc(100% - 20px);
            left: 10px;
            bottom: 10px;
            z-index: 5;
        `}
`;

export const BuyOverlay = styled(m.div)`
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
