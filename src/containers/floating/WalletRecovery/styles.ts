import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    padding: 10px;
    display: flex;
    gap: 20px;
    width: clamp(300px, 44vw, 580px);
`;

export const TextWrapper = styled.div`
    gap: 10px;
    flex-direction: column;
    display: flex;

    p {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const WalletList = styled.div`
    flex-direction: column;
    display: flex;
    gap: 8px;
    max-height: 40vh;
    overflow-y: auto;
`;

export const WalletEntry = styled.div`
    flex-direction: column;
    display: flex;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background-color: ${({ theme }) => theme.palette.background.main};
`;

export const WalletRow = styled.div`
    align-items: center;
    justify-content: space-between;
    display: flex;
    gap: 12px;
`;

export const ConfirmPanel = styled.div`
    flex-direction: column;
    display: flex;
    gap: 8px;

    p {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const WalletLabel = styled.div`
    flex-direction: column;
    display: flex;
    gap: 2px;
`;

export const AddressPrefix = styled.code`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 13px;
    font-weight: 500;
`;
