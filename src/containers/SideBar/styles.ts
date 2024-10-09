import styled from 'styled-components';
import { sidebarWidth } from '../../theme/styles';

import { m } from 'framer-motion';

// SideBar
export const SideBarContainer = styled(m.div)`
    width: ${sidebarWidth};
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.background.paper};
    position: relative;
    height: 100%;
    overflow: hidden;
    padding: 16px 0 0;
`;

export const Scroll = styled(m.div)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    gap: 8px;
    height: 100%;
    padding: 0px 10px 12px 10px;
`;

export const Top = styled(m.div)`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const SidebarTop = styled('div')`
    display: flex;
    flex-direction: column;
    padding: 0 10px 10px 10px;
    gap: 20px;
`;

export const Bottom = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-bottom: 188px; // to cater for wallet card
`;
