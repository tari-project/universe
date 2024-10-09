import { m } from 'framer-motion';
import styled from 'styled-components';

import { IconButton } from '@app/components/elements/Button';
import cardBg from '../../../../assets/images/wallet-bg.png';
import { ButtonBase } from '@app/components/elements/buttons/ButtonBase.tsx';

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
    overflow: hidden;
    justify-content: space-between;
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
    height: 140px;
`;

export const BalanceVisibilityButton = styled(IconButton)`
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2) !important;
    height: 22px;
    width: 22px;
`;

export const ShowHistoryButton = styled(ButtonBase).attrs({
    size: 'xs',
    variant: 'outlined',
    color: 'secondary',
})`
    display: flex;
    align-self: flex-end;

    &:hover {
        border-color: rgba(255, 255, 255, 0.4);
    }
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
    gap: 6px;
    padding-bottom: 10px;
    color: ${({ theme }) => theme.palette.base};
`;
