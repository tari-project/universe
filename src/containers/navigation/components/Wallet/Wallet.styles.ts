import * as m from 'motion/react-m';
import styled from 'styled-components';

import { IconButton } from '@app/components/elements/buttons/IconButton.tsx';

export const WalletBalance = styled(m.div)`
    display: flex;
    justify-content: flex-start;
    color: ${({ theme }) => theme.palette.text.primary};
    width: 100%;
`;

export const WalletBalanceWrapper = styled.div`
    width: 100%;
    display: flex;
    height: 46px;
    align-items: center;
`;

export const WalletBalanceContainer = styled(m.div)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    flex-shrink: 0;
    color: ${({ theme }) => theme.palette.text.secondary};
`;

export const BalanceVisibilityButton = styled(IconButton)`
    border-radius: 50%;
    background: ${({ theme }) => theme.palette.background.paper};
    height: 22px;
    width: 22px;
    svg {
        fill: ${({ theme }) => theme.palette.text.primary};
    }
`;
