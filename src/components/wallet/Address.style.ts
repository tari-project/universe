import styled from 'styled-components';

export const QRContainer = styled.div`
    display: flex;
    width: 100%;
    border-radius: 20px;
    background: ${({ theme }) => theme.palette.contrast};
    padding: 10px;
    overflow: hidden;
    align-items: center;
    justify-content: center;
`;
export const AddressContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 8px;
    p {
        font-weight: 500;
    }
`;

export const ContentWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
`;
export const EmojiAddressWrapper = styled.div`
    p {
        font-size: 14px;
    }
    span {
        font-size: 20px;
        font-weight: 600;
        letter-spacing: -1.6px;
    }
`;

export const AddressWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    height: 34px;
    gap: 10px;
`;

export const ToggleWrapper = styled.div`
    display: flex;
`;
