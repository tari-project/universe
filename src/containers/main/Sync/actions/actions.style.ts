import styled from 'styled-components';

export const ButtonIconWrapper = styled.div`
    width: 30px;
    height: 30px;
    color: ${({ theme }) => theme.palette.contrast};
    background-color: ${({ theme }) => theme.palette.base};
    border-radius: 50%;
    overflow: hidden;
    padding: 8px;
    display: flex;
    align-items: center;
    svg {
        max-width: 100%;
    }
`;
