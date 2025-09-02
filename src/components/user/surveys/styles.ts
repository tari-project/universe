import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 10px;
    width: 100%;
    max-width: 580px;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    padding: 12px 0 0;
    width: 100%;
`;

export const FormContent = styled.div`
    display: flex;
    gap: 10px;
    flex-direction: column;
`;

export const Title = styled(Typography)`
    font-size: clamp(24px, 1.2rem + 1vh, 30px);
    line-height: 1.6;
`;

export const Description = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: clamp(13px, 0.4rem + 0.5vh, 16px);
    font-weight: 400;
`;

export const ItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px;
    border-radius: 10px;
    background-color: ${({ theme }) => theme.palette.background.accent};
`;

export const TextItemLabel = styled.label`
    margin-top: 16px;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;

    span {
        opacity: 0.5;
        font-size: 12px;
    }
`;
export const TextItem = styled(TextArea)`
    display: flex;
    font-size: 14px;
    padding: 20px;
    background-color: ${({ theme }) => theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};
    &::placeholder {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;

export const CTAWrapper = styled.div`
    width: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 20px 0;
    gap: 10px;
    font-weight: 500;
    font-size: 18px;
`;
