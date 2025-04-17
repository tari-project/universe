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
    background: rgba(255, 255, 255, 0.7);
    box-shadow: 0px 4px 74px 0px #00000026;
    backdrop-filter: blur(5px);
    border-radius: 20px;
    padding: 20px;
    min-width: 400px;
    min-height: 340px;
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
    gap: 2px;

    button {
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
        padding: 12px;
        img {
            width: 30px;
        }
        &:hover {
            background: #f5f5f5;
        }
    }
`;

export const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: rgba(0, 0, 0, 0.1);
    margin-top: 20px;
`;

export const PortalWrapper = styled.div`
    padding: 15px;
    border-radius: 15px;
    background: #ebebeb;
    display: flex;
    gap: 14px;
    align-items: center;
    cursor: pointer;
    &:hover {
        background: #f5f5f5;
    }
`;

export const PortalCopy = styled.div`
    display: flex;
    flex-direction: column;
    h3 {
        font-family: Poppins;
        font-weight: 600;
        font-size: 14px;
        line-height: 100%;
        color: black;
        margin: 0;
        margin-bottom: 5px;
    }
    span {
        font-family: Poppins;
        font-weight: 400;
        font-size: 12px;
        line-height: 100%;
        color: rgba(0, 0, 0, 0.5);
        margin: 0;
    }
`;

export const WalletAddress = styled.div`
    ellipsis: true;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%;
`;
