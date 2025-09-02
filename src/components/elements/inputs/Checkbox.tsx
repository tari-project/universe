import styled, { css } from 'styled-components';
import { InputHTMLAttributes } from 'react';
import CheckIcon from '@app/assets/icons/CheckIcon.tsx';

interface CheckboxInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> {
    labelText?: string;
}

const Wrapper = styled.label`
    display: flex;
    gap: 10px;
`;
const Input = styled.input.attrs({ type: 'checkbox' })``;

const Box = styled.div<{ $checked: boolean }>`
    width: 25px;
    height: 25px;
    flex-shrink: 0;
    border-radius: 20%;
    border: 2px solid ${({ theme }) => theme.palette.divider};
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    transition: background-color 0.4s;
    ${({ $checked }) =>
        $checked &&
        css`
            background: #68cd4a;
            opacity: 1;
        `}
`;

export const Checkbox = (props: CheckboxInputProps) => {
    return (
        <Wrapper>
            <Box $checked={props.checked ?? false}>{props.checked && <CheckIcon />}</Box>
            <Input {...props} />
            <span>{props.labelText}</span>
        </Wrapper>
    );
};
