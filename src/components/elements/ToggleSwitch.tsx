import styled, { css } from 'styled-components';
import { InputHTMLAttributes, ReactNode } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.label<{ $disabled?: boolean; $isLoading?: boolean }>`
    display: flex;
    cursor: pointer;
    position: relative;

    ${({ $disabled }) =>
        $disabled &&
        css`
            cursor: auto;
            pointer-events: none;
            opacity: 0.8;
        `}
    ${({ $isLoading }) =>
        $isLoading &&
        css`
            cursor: wait;
            opacity: 0.7;
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

const Switch = styled.div<{ $hasDecorators?: boolean }>`
    position: relative;
    background: ${({ theme, $hasDecorators }) =>
        $hasDecorators
            ? theme.colors.greyscale[950]
            : theme.mode === 'dark'
              ? theme.colors.grey[900]
              : theme.colors.grey[300]};

    border-radius: 24px;
    transition: background 0.2s ease-in-out;

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

const Input = styled.input<{ $isSolid?: boolean; $hasDecorators?: boolean; $isLoading?: boolean }>`
    position: absolute;
    opacity: 0;
    width: 36px;
    height: 20px;
    margin: 0;
    cursor: pointer;
    z-index: 1;

    &:disabled {
        pointer-events: none;
        cursor: not-allowed;
    }

    &:focus-visible + ${Switch} {
        outline: 2px solid ${({ theme }) => theme.palette.focusOutline};
        outline-offset: 2px;
    }

    &:disabled:not(:checked) + ${Switch} {
        background: ${({ theme }) => theme.colorsAlpha.darkAlpha[20]};
    }

    &:checked + ${Switch} {
        background: ${({ $hasDecorators, $isSolid, theme }) =>
            $hasDecorators
                ? theme.colors.greyscale[950]
                : $isSolid
                  ? theme.palette.success.light
                  : `radial-gradient(50px 45px at -15px 15px, #000 0%, ${theme.colors.teal[800]} 100%)`};

        &:before {
            background: #fff;
            box-shadow: 0 3px 3px 0 rgba(0, 0, 0, 0.25);
            transform: translate(15px, -50%);
        }
    }

    &:checked:not(:disabled) + ${Switch} {
        background: ${({ $hasDecorators, $isSolid, theme }) =>
            $hasDecorators
                ? theme.colors.greyscale[950]
                : $isSolid
                  ? theme.palette.success.main
                  : `radial-gradient(at 100% 100%, #000 0% ${theme.colors.teal[800]} 90%)`};
    }

    ${({ $isLoading }) =>
        $isLoading &&
        css`
            cursor: wait;
            opacity: 0.7;
        `}
`;

const Decorator = styled.div<{ $first?: boolean; $checked?: boolean }>`
    position: absolute;
    z-index: 2;
    width: 20px;
    height: 20px;

    color: ${({ $checked, theme }) => theme.colors.greyscale[$checked ? 50 : 950]};

    ${({ $first }) =>
        $first
            ? css`
                  top: 4px;
                  left: 0.3rem;
              `
            : css`
                  top: -1px;
                  right: -3px;
              `}
`;

interface ToggleSwitchProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    customDecorators?: { first: ReactNode; second?: ReactNode };
    variant?: 'solid' | 'gradient';
    isLoading?: boolean;
}
export function ToggleSwitch({
    label,
    variant = 'solid',
    disabled,
    onChange,
    customDecorators,
    isLoading = false,
    ...props
}: ToggleSwitchProps) {
    const isSolid = variant === 'solid';

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onChange?.({ target: { checked: !props.checked } } as React.ChangeEvent<HTMLInputElement>);
        }
    };

    const switchMarkup = (
        <Wrapper $isLoading={isLoading} $disabled={disabled}>
            {customDecorators?.first ? (
                <Decorator $first $checked={props.checked}>
                    {customDecorators?.first}
                </Decorator>
            ) : null}
            {customDecorators?.second ? (
                <Decorator $checked={props.checked}>{customDecorators?.second}</Decorator>
            ) : null}
            <Input
                $isLoading={isLoading}
                disabled={disabled}
                checked={props.checked || false}
                type="checkbox"
                onChange={onChange}
                onKeyDown={handleKeyDown}
                $hasDecorators={!!customDecorators}
                $isSolid={isSolid}
                {...props}
            />
            <Switch $hasDecorators={!!customDecorators} />
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
