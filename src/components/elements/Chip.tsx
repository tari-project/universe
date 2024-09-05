import { CSSProperties, ReactNode } from 'react';
import styled, { css } from 'styled-components';

interface ChipProps {
    children: ReactNode;
    size?: 'small' | 'medium' | 'large';
    background?: CSSProperties['backgroundColor'];
    color?: CSSProperties['color'];
}

interface StyleProps {
    $size?: ChipProps['size'];
    $background?: ChipProps['background'];
    $color?: ChipProps['color'];
}
const Wrapper = styled.div<StyleProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    max-height: 20px;
    background: ${({ theme, $background }) => $background || theme.palette.contrast};
    color: ${({ theme, $color }) => $color || theme.palette.text.contrast};
    font-family: Poppins, sans-serif;
    width: max-content;
    span {
        display: flex;
        line-height: 1.05;
        font-weight: 600;
        user-select: none;
    }

    ${({ $size }) => {
        switch ($size) {
            case 'small': {
                return css`
                    padding: 4px 6px;
                    span {
                        font-size: 10px;
                    }
                `;
            }
            case 'large': {
                return css``;
            }
            case 'medium':
            default: {
                return css`
                    padding: 6px 14px;
                    span {
                        font-size: 11px;
                    }
                `;
            }
        }
    }}
`;

export function Chip({ children, size = 'medium', background, color }: ChipProps) {
    return (
        <Wrapper $size={size} $background={background} $color={color}>
            <span>{children}</span>
        </Wrapper>
    );
}
