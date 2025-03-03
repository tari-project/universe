import * as m from 'motion/react-m';
import styled from 'styled-components';

import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export const WalletBalance = styled(m.div)`
    display: flex;
    justify-content: flex-start;
    color: #fff;
    width: 100%;
`;

export const WalletBalanceWrapper = styled.div`
    width: 100%;
    height: 51px;

    display: flex;
    align-items: center;
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
`;

export const BalanceVisibilityButton = styled(IconButton)`
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2) !important;
    height: 22px;
    width: 22px;
`;
