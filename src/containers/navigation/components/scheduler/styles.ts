import styled from 'styled-components';

export const StyledCTA = styled.button`
    display: flex;
    height: 30px;
    justify-content: center;
    align-items: center;
    align-self: stretch;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.palette.divider};
    color: ${({ theme }) => theme.colors.greyscale[400]};
    gap: 10px;

    font-size: 12px;
    font-weight: 500;
    line-height: 1.1;

    svg {
        display: flex;
        height: 20px;
    }
`;
