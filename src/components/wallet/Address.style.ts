import styled from 'styled-components';

export const AddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const QRContainer = styled.div`
    display: flex;
    width: 100%;
    border-radius: 10px;
    padding: 10px;
    background: ${({ theme }) => theme.palette.contrast};
    overflow: hidden;
    align-items: center;
    justify-content: center;
`;
export const AddressContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    word-wrap: break-word;
    max-width: 200px;
`;
