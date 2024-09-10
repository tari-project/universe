import styled from 'styled-components';
import { sidebarWidth } from '../../theme/styles';
import cardBg from '../../assets/images/card.png';
import gem from '../../assets/images/gem-sml.png';

import { LinearProgress } from '@app/components/elements/LinearProgress.tsx';
import { motion } from 'framer-motion';

// SideBar
export const SideBarContainer = styled(motion.div)`
    width: ${sidebarWidth};
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    box-shadow: 0 0 45px 0 rgba(0, 0, 0, 0.15);
    border-radius: ${({ theme }) => theme.shape.borderRadius.app};
    background: ${({ theme }) => theme.palette.background.paper};
    padding: 16px 0;
    gap: 8px;
    position: relative;
`;

export const TopContainer = styled(motion.div)`
    padding: 0 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const SideBarInner = styled(motion.div)`
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 0 16px;
    height: 100%;
`;

export const BottomContainer = styled(motion.div)`
    display: flex;
    justify-content: flex-start;
    justify-self: flex-end;
    width: 100%;
    padding: 0 16px;
`;

// Wallet
export const WalletContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    background-image: url(${cardBg});
    height: 150px;
    background-repeat: no-repeat;
    background-position: top left;
    padding: 10px;
    border-radius: 20px;
    width: 100%;
    position: relative;
    box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.3);
`;

export const Handle = styled(motion.div)`
    background-color: ${({ theme }) => theme.palette.text.secondary};
    width: 52px;
    height: 3px;
    border-radius: 2px;
    display: flex;
`;

// Milestones
export const ProgressBox = styled(motion.div)`
    background-color: ${({ theme }) => theme.palette.background.paper};
    padding: 3px;
    border-radius: 10px;
    width: 100%;
    border: 1px solid ${({ theme }) => theme.palette.divider};

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1px;
    position: relative;
`;

export const StyledLinearProgress = styled(LinearProgress)`
    background-color: transparent;
    padding: 3px;
    border-radius: 10px;
    flex-grow: 1;
`;

export const GemBox = styled(motion.div)`
    background-image: url(${gem});
    background-repeat: no-repeat;
    background-position: center;
    background-size: 8px;
    width: 14px;
    height: 14px;
    position: absolute;
    right: 1px;
    border-radius: 50%;
    border: 1px solid #d3d3d3;
`;
