import styled from 'styled-components';

export const Wrapper = styled.div`
    flex-direction: column;
    padding: 10px;
    display: flex;
    gap: 28px;
    width: clamp(300px, 44vw, 580px);
`;

export const TextWrapper = styled.div`
    gap: 10px;
    flex-direction: column;
    display: flex;

    p {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const ButtonSectionWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
`;

export const ButtonsWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 12px;

    button {
        font-weight: 600;
        font-size: 14px;
        color: #ffffff !important;
        text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3);
    }
`;

export const CheckboxWrapper = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;

    span {
        font-size: 14px !important;
        font-weight: 500 !important;
    }
`;
