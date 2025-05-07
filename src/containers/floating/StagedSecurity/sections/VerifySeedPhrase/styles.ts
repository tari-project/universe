import * as m from 'motion/react-m';
import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    width: 100%;
    max-width: 720px;
    @media (max-height: 900px) {
        padding-top: 10px;
        gap: 10px;
    }
`;

export const TextWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
`;

export const PhraseWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
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

export const ButtonWrapper = styled('div')`
    width: 100%;
    max-width: 566px;
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
