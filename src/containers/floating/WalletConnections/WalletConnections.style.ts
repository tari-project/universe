import { styled } from 'styled-components';
import * as motion from 'motion/react-m';

export const WalletConnectionOverlay = styled(motion.div)`
    position: fixed;
    inset: 0;
    z-index: 100;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const WalletConnectionsContainer = styled(motion.div)`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.75);
    box-shadow: 0px 4px 74px 0px #00000026;
    backdrop-filter: blur(54px);
    border-radius: 20px;
    padding: 20px;
    min-width: 400px;
    min-height: 340px;
`;
