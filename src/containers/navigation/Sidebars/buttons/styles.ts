import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Button = styled.button<{ $isActive: boolean; $isToggle?: boolean }>`
    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: ${({ theme }) =>
        theme.mode === 'dark' ? theme.palette.background.default : theme.palette.background.accent};
    color: ${({ theme }) => theme.palette.text.primary};

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    width: 56px;
    height: 56px;
    padding: 13px;
    border-radius: 12px;

    cursor: pointer;

    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    svg {
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &:hover,
    &:active {
        svg {
            transform: scale(1.1);
        }
    }

    &:active {
        svg {
            transform: scale(1);
        }
    }

    &:disabled {
        opacity: 0.5;
        cursor: default;
        pointer-events: none;

        * {
            pointer-events: none;
        }
    }

    ${({ $isActive }) =>
        $isActive &&
        css`
            background: ${({ theme }) => (theme.mode === 'dark' ? theme.palette.divider : theme.palette.text.primary)};
            color: ${({ theme }) =>
                theme.mode === 'dark' ? theme.palette.text.primary : theme.palette.background.default};
            border-color: ${({ theme }) =>
                theme.mode === 'dark' ? theme.palette.divider : theme.palette.text.primary};
            cursor: default;

            &:hover,
            &:active {
                background: ${({ theme }) =>
                    theme.mode === 'dark' ? theme.palette.divider : theme.palette.text.primary};
                color: ${({ theme }) =>
                    theme.mode === 'dark' ? theme.palette.text.primary : theme.palette.background.default};
                border-color: ${({ theme }) =>
                    theme.mode === 'dark' ? theme.palette.divider : theme.palette.text.primary};

                svg {
                    transform: scale(1);
                }
            }
        `}

    ${({ $isToggle }) =>
        $isToggle &&
        css`
            cursor: pointer;
        `}
`;

export const DecorationWrapper = styled.div<{ $offset?: number; $side?: 'left' | 'right' }>`
    z-index: 2;
    position: absolute;
    top: ${({ $offset = 5 }) => `-${$offset}px`};

    ${({ $side = 'left', $offset = 5 }) =>
        $side === 'left'
            ? css`
                  left: ${`-${$offset}px`};
              `
            : css`
                  right: ${`-${$offset}px`};
              `}
`;

export const Alert = styled.div`
    border: 2px solid #fff;
    background-color: #ff1f1f;
    width: 17px;
    height: 17px;
    border-radius: 50%;
`;
