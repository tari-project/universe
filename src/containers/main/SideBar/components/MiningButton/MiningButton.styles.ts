import styled, { css } from 'styled-components';
import { Button } from '@app/components/elements/buttons/Button.tsx';
import { convertHexToRGBA } from '@app/utils/convertHex.ts';

export const IconWrapper = styled.div`
    width: 27px;
    height: 27px;
    border-radius: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    svg {
        height: 16px;
    }
`;

export const ButtonWrapper = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.shape.borderRadius.button};
    width: 100%;
`;

export const StyledButton = styled(Button)<{ $hasStarted: boolean; $isLoading?: boolean }>`
    width: 100%;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    padding: 16px 0;
    background-color: ${({ theme }) => convertHexToRGBA(theme.palette.base, 0.5)};
    background-image: ${({ $hasStarted, theme }) =>
        $hasStarted ? theme.gradients.miningButtonStarted : 'linear-gradient(90deg, #046937 0%, #188750 92.49%)'};

    color: #fff;
    box-shadow: 0 0 3px 0 ${({ theme }) => convertHexToRGBA(theme.palette.base, 0.58)} inset;
    transition: all 0.7s cubic-bezier(0.39, 0.3, 0.2, 0.87);

    &:hover {
        background-image: ${({ $hasStarted, theme }) =>
            $hasStarted
                ? theme.gradients.miningButtonHover
                : 'linear-gradient(90deg, #046937 0%, rgba(17, 110, 64, 0.96) 92.49%)'};
    }

    &:disabled {
        opacity: 0.45;
        cursor: wait;
        &:hover {
            background-image: ${({ $hasStarted }) =>
                $hasStarted
                    ? 'linear-gradient(90deg, rgba(100, 100, 100, 0.6) 0%, rgba(0,0,0,0.7) 99.49%)'
                    : 'linear-gradient(90deg, #046937 0%, #188750 92.49%)'};
        }
    }

    ${({ $isLoading }) =>
        $isLoading &&
        css`
            background-image: linear-gradient(90deg, rgba(100, 100, 100, 0.6) 0%, rgba(0, 0, 0, 0.7) 99.49%);
            color: transparent;
            box-shadow: none;
            pointer-events: none;
            opacity: 1;
            cursor: wait;

            svg {
                color: #fff;
                width: 36px;
            }

            &:disabled {
                opacity: 0.6;
            }
        `}
`;
