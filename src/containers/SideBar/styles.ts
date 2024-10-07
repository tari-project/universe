import styled from 'styled-components';
import { sidebarWidth } from '../../theme/styles';
import gem from '../../assets/images/gem-sml.png';

import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { m } from 'framer-motion';

// SideBar
export const SideBarContainer = styled(m.div)`
    width: ${sidebarWidth};
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    background: ${({ theme }) => theme.palette.background.paper};
    position: relative;
    height: 100%;
    overflow: hidden;
    padding: 16px 0 0;
`;

// Milestones
export const ProgressBox = styled(m.div)`
    background-color: ${({ theme }) => theme.palette.background.paper};
    padding: 3px;
    border-radius: 10px;
    width: 100%;
    border: 1px solid ${({ theme }) => theme.palette.divider};

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1px;
`;

export const StyledLinearProgress = styled(LinearProgress)`
    background-color: transparent;
    padding: 3px;
    border-radius: 10px;
    flex-grow: 1;
`;

export const GemBox = styled(m.div)`
    background-image: url(${gem});
    background-repeat: no-repeat;
    background-position: center;
    background-size: 8px;
    width: 14px;
    height: 14px;
    position: relative;
    right: 1px;
    border-radius: 50%;
    border: 1px solid #d3d3d3;
`;

export const Scroll = styled(m.div)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    gap: 8px;
    height: 100%;
`;
export const Top = styled(m.div)`
    display: flex;
    flex-direction: column;
`;
export const Bottom = styled(m.div)`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;
