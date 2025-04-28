import styled from 'styled-components';

export const WalletSections = styled.div`
    padding: 20px 0 0 0;
    height: 100%;
`;

export const WalletGreyBox = styled.div`
    border-radius: 20px;
    background: ${({ theme }) => (theme.mode === 'dark' ? '#2E2E2E' : '#E9E9E9')};
    padding: 15px 11px 11px 11px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
`;
