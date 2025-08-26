import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    gap: 20px;
    flex-direction: column;
    padding: 4px 10px;
    color: ${({ theme }) => theme.palette.text.primary};
`;

export const CTAWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: flex-end;
    margin: 10px 0 0 0;
`;

export const ManufacturerWrapper = styled.div`
    gap: 6px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    p {
        color: ${({ theme }) => theme.palette.text.accent};
        font-weight: 500;
    }
`;
