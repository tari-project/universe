import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    padding: 10px 10px 0;
    display: flex;
    gap: 24px;
    width: 500px;
`;

export const TextWrapper = styled.div`
    gap: 10px;
    flex-direction: column;
    display: flex;

    p {
        color: ${({ theme }) => theme.palette.text.accent};
        font-size: 14px;
        letter-spacing: -0.21px;
    }
`;

export const ButtonWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;

    button {
        font-weight: 600;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;
