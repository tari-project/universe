import styled from 'styled-components';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    padding-top: min(1vh, 10px);
    width: 100%;
`;
export const FormContent = styled.div`
    gap: 10px;
    display: flex;
    flex-direction: column;
    padding-bottom: 5px;
`;

export const Description = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.accent};
    font-size: clamp(14px, 0.4rem + 0.5vh, 16px);
    line-height: 1.2;
    font-weight: 400;
    margin: 0 0 10px;
`;

export const ItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: min(2.2vh, 20px);
    border-radius: 10px;
    background-color: ${({ theme }) => theme.palette.background.accent};
`;
export const TextItemLabel = styled.label`
    margin-top: min(1.6vh, 16px);
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
    opacity: 0.9;
    font-size: 14px;
    padding: min(2.2vh, 20px);
    background-color: ${({ theme }) => theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};
    line-height: 2;
    &::placeholder {
        color: ${({ theme }) => theme.palette.text.accent};
    }
`;
export const CTAWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: min(1vh, 10px);
    padding: clamp(10px, 2.2vh, 20px) 0 0;
    font-weight: 500;
    font-size: 18px;
`;
