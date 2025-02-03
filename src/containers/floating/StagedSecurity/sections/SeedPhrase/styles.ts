import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 25px;

    padding-top: 60px;
    width: 100%;
    max-width: 710px;
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
`;

export const PhraseWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    width: 100%;
`;

export const GroupCol = styled('div')`
    display: flex;
    justify-content: space-between;
    padding-right: 20px;
    gap: 20px;
    width: 100%;
`;
export const WordList = styled('div')`
    display: flex;
    gap: 5px;
    justify-content: space-between;
    width: 100%;
    max-width: 566px;
`;

export const WordColumn = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding-top: 10px;
`;

export const Word = styled('div')`
    color: #000;
    font-size: 18px;
    font-weight: 600;
    line-height: 100%;

    display: flex;
    align-items: center;
    gap: 10px;

    span {
        color: rgba(0, 0, 0, 0.5);
    }
`;

export const GroupDivider = styled('div')`
    background: rgba(0, 0, 0, 0.15);
    width: 1px;
    height: 241px;
`;

export const CopyButton = styled('button')`
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    align-self: stretch;

    height: 44px;
    padding: 0px 25px;

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

export const ButtonWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 566px;
`;

export const CheckboxWrapper = styled('div')`
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    cursor: pointer;
`;

export const Checkbox = styled('div')<{ $checked: boolean }>`
    width: 25px;
    height: 25px;
    flex-shrink: 0;

    border-radius: 5.75px;
    border: 3.25px solid #000;
    opacity: 0.5;

    display: flex;
    justify-content: center;
    align-items: center;

    position: relative;

    ${({ $checked }) =>
        $checked &&
        css`
            background: #fff;
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

export const CheckboxText = styled('div')`
    color: rgba(0, 0, 0, 0.75);
    font-size: 14px;
    font-weight: 400;
    line-height: 100%;
`;
