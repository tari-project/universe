import { m } from 'framer-motion';
import styled from 'styled-components';

import cardBg from '../../../../assets/images/wallet-bg.png';
import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

// Wallet
export const WalletContainer = styled(m.div)`
    display: flex;
    flex-direction: column;
    background-image: url(${cardBg});
    background-size: cover;
    background-repeat: no-repeat;
    background-position: top left;
    padding: 10px;
    border-radius: 20px;
    position: absolute;
    bottom: 12px;
    left: 10px;
    width: 328px;
    box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.3);
    max-height: 508px;
    min-height: 178px;
    z-index: 2;

    justify-content: space-between;

    @media (max-height: 670px) {
        min-height: 140px;
    }
`;

export const WalletBalance = styled.div`
    display: flex;
    justify-content: flex-start;
    color: #fff;
    width: 100%;
`;

export const WalletBalanceContainer = styled(m.div)`
    display: flex;
    flex-direction: column;
    position: relative;
    justify-content: flex-end;
    align-items: flex-start;
    width: 100%;
    color: ${({ theme }) => theme.palette.text.secondary};
    padding: 10px 5px 5px;
    height: 160px;

    @media (max-height: 670px) {
        height: 120px;
    }
`;

export const BalanceVisibilityButton = styled(IconButton)`
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2) !important;
    height: 22px;
    width: 22px;
`;

export const ScrollMask = styled(m.div)`
    position: absolute;
    background: linear-gradient(to top, #000 20%, rgba(9, 11, 12, 0.01));
    bottom: 0;
    left: 0;
    height: 30px;
    width: 100%;
    z-index: 1;
    opacity: 0.7;
`;

export const HistoryContainer = styled(m.div)`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    width: 100%;
    position: relative;

    color: ${({ theme }) => theme.palette.base};
`;

export const HistoryPadding = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 0 5px 60px 5px;
`;

export const WalletCornerButtons = styled('div')`
    position: absolute;
    top: 10px;
    right: 13px;
    z-index: 2;

    display: flex;
    gap: 3px;
`;

export const CornerButton = styled('button')`
    color: #fff;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;

    border-radius: 43px;
    border: 1px solid rgba(156, 156, 156, 0.18);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(7px);

    padding: 0 8px;

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    transition: all 0.2s ease;
    pointer-events: all;

    &:hover {
        border: 1px solid rgba(156, 156, 156, 0.18);
        background: rgba(255, 255, 255, 0.3);
    }
`;
