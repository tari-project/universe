import styled from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: clamp(500px, 30vw, 620px);
    gap: 6px;
    padding: 0 10px;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px 0;
    gap: 10px;
`;

export const Description = styled(Typography)`
    color: ${({ theme }) => theme.palette.text.accent};
    font-weight: 400;
`;

export const CheckboxWrapper = styled.div`
    display: flex;
    width: 100%;
    padding: 20px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.4);
`;

export const TextboxWrapper = styled.div`
    display: flex;
    border: 1px solid firebrick;
`;
