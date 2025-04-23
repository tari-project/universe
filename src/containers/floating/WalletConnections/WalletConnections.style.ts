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

export const WalletConnectionsContainer = styled.div`
    display: flex;
    flex-direction: column;
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 0px 4px 74px 0px #00000026;
    backdrop-filter: blur(5px);
    border-radius: 20px;
    padding: 20px;
    min-width: 400px;
    min-height: 340px;
    overflow-x: hidden;
`;

export const WalletConnectHeader = styled.div`
    margin-bottom: 20px;
    font-family: Poppins;
    font-weight: 600;
    font-size: 21px;
    leading-trim: Cap height;
    line-height: 31px;
    color: black;
    padding-left: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

export const TopArea = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
`;

export const IconContainer = styled.div`
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
`;

export const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 24px;
    padding: 24px;
    min-width: 480px;
`;

export const ConnectButton = styled.button`
    cursor: pointer;
    border-radius: 12px;
    display: flex;
    align-items: center;
    width: 100%;
    background: white;
    color: black;
    gap: 16px;
    font-family: Poppins;
    font-weight: 600;
    font-size: 14px;
    line-height: 100%;
    padding: 10px 12px;
    img {
        width: 25px;
    }
    &:hover {
        background: #f5f5f5;
    }
`;

export const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin-top: 20px;
`;

export const WalletAddress = styled.div`
    color: black;
    ellipsis: true;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%;
`;
