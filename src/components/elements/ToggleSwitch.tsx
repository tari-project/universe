import styled, { css } from 'styled-components';
import { InputHTMLAttributes } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.label<{ $disabled?: boolean }>`
    display: flex;
    cursor: pointer;
    position: relative;

    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
            opacity: 0.8;
        `}
`;
const Label = styled.label<{ $disabled?: boolean }>`
    user-select: none;
    cursor: pointer;
    border-radius: 40px;
    background: ${({ theme }) => theme.palette.background.paper};
    box-shadow: 0 8px 12px -7px ${({ theme }) => (theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.3)')};

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 12px;
    width: max-content;
    padding: 5px 5px 5px 15px;

    ${({ $disabled }) =>
        $disabled &&
        css`
            pointer-events: none;
            opacity: 0.8;
        `}
`;

const Switch = styled.div`
    position: relative;
    background: ${({ theme }) => (theme.mode === 'dark' ? theme.colors.grey[900] : theme.colors.grey[300])};

    border-radius: 24px;
    transition: 300ms all;
    width: 36px;
    height: 20px;
    padding: 3px 2px;
    gap: 10px;

    &:before {
        content: '';
        position: absolute;
        width: 15px;
        height: 15px;
        border-radius: 100%;
        top: 50%;
        left: 3px;
        background: #fff;
        transform: translate(0, -50%);
        transition: 300ms all;
    }
`;

const Input = styled.input<{ $isSolid?: boolean }>`
    position: absolute;
    opacity: 0;
    width: 36px;
    height: 20px;
    margin: 0;
    cursor: pointer;

    &:disabled {
        pointer-events: none;
        cursor: not-allowed;
    }

    &:focus + ${Switch} {
        outline: 3px solid #c9eb00;
        outline-offset: 2px;
    }

    &:disabled:not(:checked) + ${Switch} {
        background: ${({ theme }) => theme.colorsAlpha.darkAlpha[20]};
    }

    &:checked + ${Switch} {
        background: ${({ $isSolid, theme }) =>
            $isSolid
                ? theme.palette.success.light
                : `radial-gradient(50px 45px at -15px 15px, #000 0%, ${theme.colors.teal[700]} 100%)`};

        &:before {
            background: #fff;
            box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.25);
            transform: translate(15px, -50%);
        }
    }

    &:checked:not(:disabled) + ${Switch} {
        background: ${({ $isSolid, theme }) =>
            $isSolid
                ? theme.palette.success.main
                : `radial-gradient(at 100% 100%, #000 0% ${theme.colors.teal[700]} 90%)`};
    }
`;

interface ToggleSwitchProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    variant?: 'solid' | 'gradient';
}
export function ToggleSwitch({ label, variant = 'solid', disabled, onChange, ...props }: ToggleSwitchProps) {
    const isSolid = variant === 'solid';

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onChange?.({ target: { checked: !props.checked } } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const switchMarkup = (
        <Wrapper $disabled={disabled}>
            <Input
                disabled={disabled}
                checked={props.checked || false}
                type="checkbox"
                onChange={onChange}
                onKeyDown={handleKeyDown}
                $isSolid={isSolid}
                {...props}
            />
            <Switch />
        </Wrapper>
    );

    if (label) {
        return (
            <Label $disabled={disabled}>
                <Typography variant="h6">{label}</Typography>
                {switchMarkup}
            </Label>
        );
    } else {
        return switchMarkup;
    }
}
