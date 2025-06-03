import styled from 'styled-components';

export const SwapsContainer = styled.div``;
export const BackButton = styled.button`
    border-radius: 43px;
    padding: 2px 8px;
    gap: 3px;
    border-width: 1px;
    border: 1px solid ${({ theme }) => theme.palette.divider};

    font-family: Poppins, sans-serif;
    font-weight: 500;
    font-size: 10px;
`;
export const SectionHeaderWrapper = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    align-items: center;
`;
