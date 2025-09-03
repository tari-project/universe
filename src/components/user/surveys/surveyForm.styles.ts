import styled from 'styled-components';
import { TextArea } from '@app/components/elements/inputs/TextArea.tsx';

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
