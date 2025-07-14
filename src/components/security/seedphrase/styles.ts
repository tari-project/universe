import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';
import { convertHexToRGBA } from '@app/utils';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 710px;
    @media (max-height: 900px) {
        padding-top: 10px;
        gap: 20px;
    }
`;

export const PhraseWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    @media (max-height: 730px) {
        gap: 16px;
    }
`;

export const GroupCol = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-right: 10px;
    gap: 10px;
    width: 100%;
`;
export const WordList = styled.div`
    display: flex;
    gap: 4px;
    justify-content: space-between;
    width: 100%;
    max-width: 566px;
`;

export const WordColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: max(10px, 2vmin);
    padding: 4px 0;
`;

export const Word = styled.div`
    color: ${({ theme }) => theme.palette.text.primary};
    font-size: min(calc(1rem + 0.1vmin), 18px);
    font-weight: 600;
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 6px;

    span {
        color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.5)};
        text-align: center;
        width: 24px;
        font-variant-numeric: tabular-nums;
    }
`;

export const GroupDivider = styled.div`
    background: rgba(0, 0, 0, 0.15);
    width: 1px;
    height: 100%;
`;

export const CopyButton = styled('button')`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    align-self: stretch;

    height: 44px;
    padding: 0 25px;

    border-radius: 100px;
    border: 1px solid #b0b0b0;

    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 122%;

    transition: background 0.2s ease;
    max-width: 566px;
    width: 100%;
    margin: auto;
    cursor: pointer;

    &:hover {
        background: rgba(255, 255, 255, 0.5);
    }
`;

export const ButtonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`;

export const CheckboxWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    cursor: pointer;
`;

export const Checkbox = styled.div<{ $checked: boolean }>`
    width: 25px;
    height: 25px;
    flex-shrink: 0;

    border-radius: 0.3rem;
    border: 0.2rem solid ${({ theme }) => theme.palette.contrast};
    opacity: 0.5;

    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;

    ${({ $checked }) =>
        $checked &&
        css`
            background: ${({ theme }) => theme.palette.base};
            opacity: 1;
        `}
`;

export const Check = styled(m.div)`
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 18px;
`;

export const CheckboxText = styled.div`
    color: ${({ theme }) => convertHexToRGBA(theme.palette.contrast, 0.75)};
    font-size: 14px;
    font-weight: 400;
    line-height: 100%;
`;

export const WordButtons = styled('div')`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
`;

export const WordButton = styled('button')`
    display: flex;
    padding: 4px 6px;
    align-items: flex-start;

    border-radius: 8px;
    background: rgba(0, 0, 0, 0.1);

    color: ${({ theme }) => theme.palette.text.primary};
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;

    transition:
        background 0.2s ease,
        opacity 0.2s ease;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    &:disabled {
        opacity: 0.2;
        cursor: default;
        pointer-events: none;
    }
`;

export const WordsSelected = styled.div`
    width: 100%;
    min-height: 160px;
    border-radius: 15px;
    background: rgba(0, 0, 0, 0.15);
    display: flex;
    align-content: flex-start;
    flex-wrap: wrap;
    gap: 6px;
    padding: 10px 8px;
    position: relative;
`;

export const WordPill = styled(m.div)`
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.1);
    padding: 4px 6px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    color: ${({ theme }) => theme.palette.text.primary};

    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: rgba(0, 0, 0, 0.2);
    }
`;

export const Placeholder = styled(m.div)`
    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 100%;

    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    display: flex;
    justify-content: center;
    align-items: center;
`;
