import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';

export const WalletWrapper = styled(m.div)<{ $listHidden?: boolean; $isSwaps?: boolean }>`
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    flex-direction: column;
    border-radius: 20px;
    display: flex;
    padding: 10px;
    flex: 1 1 100%;

    ${({ $listHidden }) =>
        $listHidden &&
        css`
            flex: 0 1 0;
        `}

    ${({ $isSwaps }) =>
        $isSwaps &&
        css`
            position: absolute;
            z-index: 5;
            bottom: 12px;
            width: calc(100% - 24px);
        `}
`;

export const TabsWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
    margin: 8px 0;
`;

export const CTAWrapper = styled.div`
    margin: 8px 0 0 0;
`;
