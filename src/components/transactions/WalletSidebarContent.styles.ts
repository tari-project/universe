import styled, { css } from 'styled-components';

export const WalletSections = styled.div`
    padding: 10px 0 0 0;
    height: 100%;
    position: relative;
`;

export const WalletGreyBox = styled.div<{ $absolute?: boolean }>`
    border-radius: 20px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    padding: 15px 11px 11px 11px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    ${({ $absolute }) =>
        $absolute &&
        css`
            z-index: 4;
            position: absolute;
            bottom: 0;
            left: 0;
        `}
`;
