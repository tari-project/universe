import styled, { css } from 'styled-components';
import { convertHexToRGBA } from '@app/utils';
import { Button } from '@app/components/elements/buttons/Button.tsx';

export const Wrapper = styled.form`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 30px;
`;

export const DigitWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

export const DigitInput = styled.input<{ $isInvalid?: boolean }>`
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

export const FormCTA = styled(Button).attrs({
    size: 'xlarge',
})`
    background-color: ${({ theme }) => theme.palette.contrast};
    color: ${({ theme }) => theme.palette.text.contrast};
    transform: scale(0.99);
    &:hover:not(:disabled) {
        background-color: ${({ theme }) => theme.palette.contrast};
        color: ${({ theme }) => theme.palette.text.contrast};
        transform: scale(1);
        opacity: 0.9;
    }
`;
