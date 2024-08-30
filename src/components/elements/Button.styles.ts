import styled, { css } from 'styled-components';
import { ButtonProps } from '@app/components/elements/Button.tsx';
// import buttonBg from '@app/assets/backgrounds/button-bg.png';

const PADDING = '1rem';

interface Props {
    $variant?: ButtonProps['variant'];
    $outlined?: boolean;
}

const ROUNDED_BASE_STYLES = css`
    height: 55px;
    border-radius: ${({ theme }) => theme.shape.borderRadius.button};
    box-shadow:
            0 0 10px 0 ${({ theme }) => theme.palette.primary.shadow};,
0 0 13px 0 rgba(255, 255, 255, 0.55) inset;
`;

const SQUARED_BASE_STYLES = css`
    height: 40px;
    border: 1px solid ${({ theme }) => theme.palette.primary.main};
    border-radius: ${({ theme }) => theme.shape.borderRadius.buttonSquared};
`;

const TEXT_BASE_STYLES = css`
    color: ${({ theme }) => theme.palette.text.primary.dark};
    height: unset;
    font-size: 16px;
    padding: 4px;
    &:hover {
        background: ${({ theme }) => theme.palette.primary.shadow};
        border-radius: ${({ theme }) => theme.shape.borderRadius.buttonSquared};
    }
`;

const BASE_STYLES = css`
    cursor: pointer;
    display: inline-flex;
    font-size: 17px;
    padding: 10px ${PADDING};
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.3px;
    transition: all 0.2s ease-in-out;
    align-items: center;
    justify-content: center;
    position: relative;

    &:active {
        opacity: 0.9;
    }
    &:hover {
        opacity: 0.8;
    }
    &:disabled {
        opacity: 0.5;
    }
`;

export const BaseButton = styled.button<Props>`
    background: ${({ theme, $outlined }) => ($outlined ? theme.palette.background.paper : theme.palette.primary.dark)};
    color: ${({ theme, $outlined }) => ($outlined ? theme.palette.primary.dark : theme.palette.text.contrast)};
    ${BASE_STYLES}
    ${({ $variant }) => {
        switch ($variant) {
            case 'text':
                return TEXT_BASE_STYLES;
            case 'rounded':
                return ROUNDED_BASE_STYLES;

            case 'squared':
            default:
                return SQUARED_BASE_STYLES;
        }
    }}        
}

`;

export const ChildrenWrapper = styled.div`
    display: flex;
`;
export const IconWrapper = styled.div<{ $position?: ButtonProps['iconPosition'] }>`
    display: flex;
    position: absolute;
    ${({ $position }) => {
        switch ($position) {
            case 'start': {
                return css`
                    left: ${PADDING};
                `;
            }
            case 'hug': {
                return css`
                    position: relative;
                `;
            }
            case 'end':
            default: {
                return css`
                    right: ${PADDING};
                `;
            }
        }
    }}
    svg {
        max-width: 100%;
        max-height: 100%;
    }
`;

export const BaseIconButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        opacity: 0.7;
    }
`;
