import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0 10px;
`;

export const QRContainer = styled.div`
    display: flex;
    width: 100%;
    border-radius: 10px;
    padding: 4px;
    background: ${({ theme }) => theme.palette.contrast};
    overflow: hidden;
    align-items: center;
    justify-content: center;
`;
export const AddressContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    gap: 8px;
`;

export const AddressWrapper = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;
