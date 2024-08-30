import styled from 'styled-components';
import { InputHTMLAttributes } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

const Wrapper = styled.label`
    display: flex;
`;
const Label = styled.label`
    cursor: pointer;

    border-radius: 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.2);
    box-shadow: 20px 20px 65px 0 rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(7px);

    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;

    color: #000;
    font-size: 12px;
    width: max-content;
    padding: 5px 5px 5px 15px;
`;

const Switch = styled.div<{ $isSolid?: boolean }>`
    position: relative;
    background: ${({ $isSolid, theme }) =>
        $isSolid
            ? theme.palette.colors.grey[300]
            : `linear-gradient(90deg, ${theme.palette.contrast} 0%, ${theme.palette.colors.teal[700]} 100%)`};

    border-radius: 24px;
    transition: 300ms all;

    width: 50px;
    height: 27px;
    padding: 3px 4px;
    gap: 10px;

    &:before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 100%;
        top: 50%;
        left: 4px;
        background: ${({ theme }) => theme.palette.base};
        transform: translate(0, -50%);
        transition: 300ms all;
    }
`;

const Input = styled.input<{ $isSolid?: boolean }>`
    display: none;
    &:disabled {
        pointer-events: none;
        opacity: 0.8;
    }
    &:checked + ${Switch} {
        background: ${({ $isSolid, theme }) =>
            $isSolid
                ? theme.palette.success.main
                : `linear-gradient(90deg, ${theme.palette.base} 0%, ${theme.palette.colors.grey[200]} 100%)`};
        &:before {
            background: ${({ $isSolid, theme }) => ($isSolid ? theme.palette.base : theme.palette.contrast)};
            box-shadow: ${({ $isSolid }) => ($isSolid ? '0 4px 4px 0 rgba(0, 0, 0, 0.25)' : 'none')};
            transform: translate(20px, -50%);
        }
    }
`;

interface ToggleSwitchProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    variant?: 'solid' | 'gradient';
}
export function ToggleSwitch({ label, variant = 'solid', ...props }: ToggleSwitchProps) {
    const isSolid = variant === 'solid';

    const switchMarkup = (
        <Wrapper>
            <Input checked={props.checked} type="checkbox" onChange={props.onChange} $isSolid={isSolid} />
            <Switch $isSolid={isSolid} />
        </Wrapper>
    );

    if (label) {
        return (
            <Label>
                <Typography variant="h6">{label}</Typography>
                {switchMarkup}
            </Label>
        );
    } else {
        return switchMarkup;
    }
}
