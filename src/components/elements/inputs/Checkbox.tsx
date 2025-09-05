import styled, { css } from 'styled-components';
import { InputHTMLAttributes } from 'react';
import CheckIcon from '@app/assets/icons/CheckIcon.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { convertHexToRGBA } from '@app/utils';

interface CheckboxInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    handleChange: (checked: boolean) => void;
    labelText?: string;
}

const Wrapper = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;
    span {
        font-size: 16px;
        font-weight: 600;
        line-height: 1.22;
    }
`;

const Box = styled.div<{ $checked: boolean }>`
    width: 25px;
    height: 25px;
    flex-shrink: 0;
    border-radius: 6px;
    border: 2px solid ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    transition: background-color 0.3s;
    ${({ $checked }) =>
        $checked &&
        css`
            background: #68cd4a;
        `}

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.palette.focusOutlineAlpha};
        outline-offset: 2px;
        transition: none;
    }
`;

export const Checkbox = ({ labelText, handleChange, ...props }: CheckboxInputProps) => {
    const checked = props.checked || false;
    function toggleChecked() {
        if (!props.id) return;
        const checkboxEl = document.getElementById(props.id);
        if (checkboxEl) {
            handleChange(!checked);
            checkboxEl.setAttribute('aria-checked', `${!checked}`);
        }
    }
    return (
        <Wrapper {...props} role="checkbox" aria-checked={checked} onClick={toggleChecked}>
            <Box
                tabIndex={0}
                $checked={checked}
                onKeyDown={(e) => {
                    if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleChecked();
                    }
                }}
            >
                {props.checked && <CheckIcon />}
            </Box>
            <Typography>{labelText}</Typography>
        </Wrapper>
    );
};
