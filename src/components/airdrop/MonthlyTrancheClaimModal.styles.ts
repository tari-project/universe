import styled from 'styled-components';
import { motion } from 'framer-motion';

export const ModalWrapper = styled(motion.div)`
    position: relative;
    width: 625px;
    height: 521px;
    border-radius: 35px;
    background: #FFFFFFBF;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    padding: 40px;
    box-sizing: border-box;
    overflow: hidden;
`;

export const CloseButton = styled.button`
    position: absolute;
    top: 20px;
    right: 20px;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    z-index: 10;

    &:hover {
        background: rgba(0, 0, 0, 0.1);
    }

    svg {
        width: 16px;
        height: 16px;
        opacity: 0.7;
    }
`;

export const ModalHeader = styled.div`
    margin-bottom: 24px;
`;

export const ModalTitle = styled.h2`
    font-size: 32px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.2;
`;

export const ModalBody = styled.p`
    font-size: 16px;
    color: #666666;
    line-height: 1.5;
    margin: 0 0 40px 0;
    max-width: 480px;
`;

export const ClaimContainer = styled.div`
    width: 535px;
    height: 192px;
    border-radius: 15px;
    gap: 20px;
    padding: 30px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    margin: 0 auto 32px auto;
    position: relative;
    
    /* Multi-layered background as specified */
    background: 
        linear-gradient(0deg, #FFFFFF, #FFFFFF),
        linear-gradient(262.12deg, #333909 2.2%, #091D07 100.01%);
    
    /* Alternative implementation if the above doesn't work */
    background-color: #091D07;
    background-image: linear-gradient(262.12deg, #333909 2.2%, #091D07 100.01%);
    
    /* Add subtle border for definition */
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

export const EyebrowText = styled.div`
    font-size: 12px;
    font-weight: 500;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #FFFFFF1A;
    padding: 6px 12px;
    border-radius: 6px;
    display: inline-block;
    width: fit-content;
    margin-bottom: 8px;
`;

export const TrancheAmount = styled.div`
    font-size: 48px;
    font-weight: 700;
    color: #FFFFFF;
    line-height: 1;
    margin: 8px 0;
`;

export const RemainingBalance = styled.div`
    font-size: 14px;
    color: #FFFFFF;
    opacity: 0.8;
    margin-top: auto;
`;

export const ClaimButton = styled.button<{ $isLoading?: boolean }>`
    width: 200px;
    height: 48px;
    border-radius: 8px;
    border: none;
    background: #000000;
    color: #FFFFFF;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0 auto;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
        background: #1a1a1a;
        transform: translateY(-1px);
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    ${({ $isLoading }) => $isLoading && `
        background: #333333;
        cursor: wait;
    `}
`;

export const LoadingSpinner = styled.div`
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #FFFFFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
