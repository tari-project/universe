import styled, { css } from 'styled-components';
import { Typography } from '@app/components/elements/Typography.tsx';
import { m } from 'motion/react';

export const Wrapper = styled.div<{ $hasError?: boolean; $disabled?: boolean }>`
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
    padding: 20px 20px 10px 20px;
    border-radius: 20px;
    opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
    transition: opacity 0.2s ease-in-out;

    background-color: ${({ theme }) => (theme.mode === 'dark' ? '#1B1B1B' : theme.palette.background.paper)};

    border: 1px solid ${({ theme }) => theme.palette.divider};

    ${({ $hasError, theme }) =>
        $hasError &&
        css`
            background-color: ${theme.mode === 'dark' ? '#3A2A2A' : '#FFF3F3'};
        `}
`;

export const AccentWrapper = styled.div`
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translate(-50%, -10px);
`;

export const StyledInput = styled.input<{ $hasIcon?: boolean }>`
    display: flex;
    padding: ${({ $hasIcon }) => ($hasIcon ? `6px 0 6px 34px` : `6px 0 6px`)};
    width: 100%;
    font-size: 1.4rem;
    letter-spacing: -1px;
    font-weight: 500;
    opacity: 0.9;

    &:focus {
        outline: none;
        opacity: 1;
    }

    &::placeholder {
        color: ${({ theme }) => theme.palette.text.shadow};
        font-size: 1.4rem;
    }
`;

export const ContentWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    width: 100%;
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 26px;
    height: 26px;
    position: absolute;
    transform: translateY(-50%);
    top: 50%;
`;

export const Label = styled(Typography).attrs({ variant: 'p' })`
    color: ${({ theme }) => theme.palette.text.accent};
    font-weight: 500;
`;

export const CheckIconWrapper = styled(m.div)`
    pointer-events: none;
    width: 25px;
    height: 25px;
`;

export const ErrorText = styled(m.div)`
    color: ${({ theme }) => theme.palette.error.main};

    font-size: 12px;
    font-weight: 500;
    width: max-content;
    overflow: hidden;
`;
