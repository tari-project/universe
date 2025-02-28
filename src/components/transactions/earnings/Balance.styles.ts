import styled from 'styled-components';

export const BalanceWrapper = styled.div`
    display: flex;
    color: ${({ theme }) => theme.palette.text.primary};
    align-items: baseline;
    gap: 10px;
    h1 {
        font-size: 72px;
        font-weight: 500;
        letter-spacing: -5px;
    }

    span {
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.869px;
    }
`;
