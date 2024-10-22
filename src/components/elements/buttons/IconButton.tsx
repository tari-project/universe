import { ButtonHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { ButtonSize } from './button.types.ts';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    size?: ButtonSize;
}
interface StyleProps {
    $size?: IconButtonProps['size'];
}
const BaseIconButton = styled.button<StyleProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    border-radius: 100%;
    transition: background-color 0.2s ease-in-out;
    cursor: pointer;
    &:hover {
        background-color: ${({ theme }) => theme.palette.primary.wisp};
    }

    ${({ $size }) =>
        $size === 'small' &&
        css`
            height: 24px;
            width: 24px;
        `}
`;

export const IconButton = ({ children, size, ...props }: IconButtonProps) => (
    <BaseIconButton $size={size} {...props}>
        {children}
    </BaseIconButton>
);
