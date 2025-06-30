import styled, { css } from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.form`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

export const DigitWrapper = styled.input<{ $isInvalid?: boolean }>`
    display: flex;
    width: 80px;
    height: 110px;
    border-radius: 20px;

    border: 1px solid ${({ theme }) => theme.palette.divider};
    background: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 20px -5px ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 500;
    text-align: center;

    ${({ $isInvalid }) =>
        $isInvalid &&
        css`
            border: 1px solid ${({ theme }) => theme.palette.error.main};
        `}
`;
