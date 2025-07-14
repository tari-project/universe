import styled, { css } from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.form`
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

export const TextWrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    white-space: pre-wrap;

    h5 {
        font-size: 30px;
    }
    p {
        font-size: 16px;
    }
`;

export const DigitWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    padding: 15px 0 0;
    gap: 10px;
`;

export const DigitInput = styled.input<{ $isInvalid?: boolean }>`
    display: flex;
    min-width: 80px;
    height: 110px;
    border-radius: 20px;
    flex-grow: 1;

    border: 1px solid ${({ theme }) => theme.palette.divider};
    background-color: ${({ theme }) => theme.palette.background.default};
    box-shadow: 0 0 20px -5px ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.1)};
    align-items: center;
    justify-content: center;
    font-size: 48px;
    font-weight: 500;
    text-align: center;

    ${({ $isInvalid }) =>
        $isInvalid &&
        css`
            border: 2px solid ${({ theme }) => (theme.mode === 'dark' ? `#FF6C6C` : `#FF6C6C`)};
            background-color: ${({ theme }) => (theme.mode === 'dark' ? `#2f2525` : `#FFE9E9`)};

            &:focus-visible {
                outline: 3px solid rgba(255, 99, 99, 0.2);
                outline-offset: 2px;
            }
        `}
`;

export const CTAWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    font-weight: 600;
    margin: 30px 0 0;
`;

export const HelpWrapper = styled.div`
    border-radius: 15px;
    border: 1px solid ${({ theme }) => (theme.mode === 'dark' ? `#623939` : `#FFD1D1`)};
    background-color: ${({ theme }) => (theme.mode === 'dark' ? `#492c2c` : `#FFE8E8`)};
    display: flex;
    padding: 20px 10px;
    justify-content: center;
    align-items: center;
    width: 100%;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
`;
