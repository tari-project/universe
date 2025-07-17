import styled from 'styled-components';

export const Button = styled.button`
    position: relative;
    z-index: 0;
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;

    border-radius: 10px;
    padding: 15px;

    background: ${({ theme }) => theme.palette.background.paper};
    border: 1px solid ${({ theme }) => theme.palette.divider};

    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 12px;
    font-weight: 500;
    line-height: 15px;
    letter-spacing: -0.36px;

    transition: all 0.2s ease-in-out;

    &:hover {
        background: ${({ theme }) => theme.palette.background.accent};
    }
`;

export const LogosWrapper = styled.div`
    height: 24px;
`;
