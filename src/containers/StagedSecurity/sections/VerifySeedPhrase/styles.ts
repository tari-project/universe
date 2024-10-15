import { m } from 'framer-motion';
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
    gap: 25px;
    width: 100%;
`;

export const WordButtons = styled('div')`
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    padding-bottom: 25px;
    width: 100%;
    max-width: 566px;
`;

export const WordButton = styled('div')<{ $selected?: boolean }>`
    display: flex;
    padding: 5px 10px;
    align-items: flex-start;

    border-radius: 8px;
    background: rgba(0, 0, 0, 0.1);

    color: #000;
    font-size: 15px;
    font-weight: 600;
    line-height: 200%;

    transition:
        background 0.2s ease,
        opacity 0.2s ease;
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.2);
    }

    ${({ $selected }) =>
        $selected &&
        css`
            opacity: 0.2;
        `};
`;

export const WordsSelected = styled('div')`
    width: 100%;
    max-width: 566px;
    height: 225px;

    border-radius: 15px;
    background: rgba(0, 0, 0, 0.15);

    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 10px;

    padding: 15px;
`;

export const WordPill = styled(m.div)`
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.1);
    padding: 0 10px;
    height: 40px;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    color: #000;
    font-size: 15px;
    font-weight: 600;
    line-height: 100%;

    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: rgba(0, 0, 0, 0.2);
    }
`;

export const ButtonWrapper = styled('div')`
    width: 100%;
    max-width: 566px;
`;
