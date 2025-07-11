import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    padding-top: 40px;
    width: 100%;
    max-width: 710px;
    @media (max-height: 900px) {
        padding-top: 10px;
        gap: 20px;
    }
`;

export const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

export const PhraseWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    width: 100%;
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
    color: #000;
    font-size: min(calc(1rem + 0.1vmin), 18px);
    font-weight: 600;
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 6px;

    span {
        color: rgba(0, 0, 0, 0.5);
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

    color: #000;
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
    gap: 20px;
    width: 100%;
    max-width: 566px;
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
    border: 0.2rem solid #000;
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
    color: rgba(0, 0, 0, 0.75);
    font-size: 14px;
    font-weight: 400;
    line-height: 100%;
`;

export const WordButtons = styled('div')`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-bottom: 10px;
    width: 100%;
    max-width: 566px;
`;

export const WordButton = styled('button')`
    display: flex;
    padding: 6px;
    align-items: flex-start;

    border-radius: 8px;
    background: rgba(0, 0, 0, 0.1);

    color: #000;
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
    max-width: 566px;
    min-height: 180px;
    border-radius: 15px;
    background: rgba(0, 0, 0, 0.15);
    display: flex;
    align-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
    position: relative;
`;

export const WordPill = styled(m.div)`
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.1);
    padding: 6px;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    color: #000;

    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: rgba(0, 0, 0, 0.2);
    }
`;

export const Placeholder = styled(m.div)`
    color: #000;
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

export const Title = styled('div')`
    color: ${({ theme }) => theme.palette.text.primary};
    text-align: center;
    font-size: min(calc(1rem + 1.1vmin), 30px);
    font-weight: 600;
    line-height: 0.9;
    max-width: 470px;
`;

export const Text = styled('div')`
    color: rgba(0, 0, 0, 0.75);
    text-align: center;
    font-size: 16px;
    font-weight: 400;
    line-height: 1.05;
    max-width: 500px;
`;
export const BlackButton = styled('button')`
    color: #c9eb00;
    text-align: center;
    font-size: 21px;
    line-height: 99.7%;
    text-transform: uppercase;
    font-family: DrukWide, sans-serif;
    font-weight: 800;

    border-radius: 49px;
    background: #000;
    box-shadow: 28px 28px 77px 0 rgba(0, 0, 0, 0.1);

    width: 100%;
    height: 81px;

    transition: opacity 0.2s ease;
    cursor: pointer;

    span {
        display: block;
        transition: transform 0.2s ease;
    }

    svg {
        width: 48px;
    }

    &:hover {
        span {
            transform: scale(1.05);
        }
    }

    &:disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    @media (max-height: 900px) {
        height: 56px;
    }
`;
