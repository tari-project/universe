import styled from 'styled-components';

export const QRContainer = styled.div`
    display: flex;
    width: 100%;
    border-radius: 20px;
    background: ${({ theme }) => theme.colors.greyscale[950]};
    padding: 15px;
    overflow: hidden;
    align-items: center;
`;
export const AddressContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 8px;
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

export const ImgOption = styled.div`
    width: 14px;
    img {
        max-width: 100%;
    }
`;
export const TextOption = styled.div`
    font-weight: 500;
    font-size: 8px;
    color: inherit;
`;
