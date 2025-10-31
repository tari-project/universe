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

export const ButtonSectionWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 18px;
`;

export const ButtonsWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;

    button {
        font-weight: 600;
        color: ${({ theme }) => theme.palette.text.primary};
    }
`;

export const CheckboxWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;

    span {
        font-size: 14px;
        font-weight: 500;
    }
`;
