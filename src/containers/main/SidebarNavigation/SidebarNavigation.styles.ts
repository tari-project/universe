import styled from 'styled-components';
import { sidebarWidth } from '@app/theme/styles.ts';
import * as m from 'motion/react-m';

export const SidebarWrapper = styled(m.div)`
    background: ${({ theme }) => theme.palette.background.default};
    width: ${sidebarWidth};
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    flex-direction: column;
    border-radius: 20px;
    position: relative;
    height: 100%;
    overflow: hidden;
    padding: 16px 10px;
    pointer-events: all;
`;

export const MinimizedWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
`;
