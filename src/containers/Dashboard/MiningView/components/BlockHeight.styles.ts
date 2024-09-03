import styled from 'styled-components';

export const Wrapper = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    position: absolute;
    right: 0;
    top: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
`;

export const RulerContainer = styled.div<{ $height?: number }>`
    top: ${({ $height }) => ($height ? `calc(50% - ${$height / 2}px)` : '50%')};
    position: absolute;
    height: 100%;
    transform: translateY(${({ $height }) => ($height ? `-calc(50% - ${$height / 2}px)` : '-50%')});
    display: flex;
    flex-direction: column;
    align-items: end;
    justify-content: center;
`;

export const RulerMarkContainer = styled.div`
    display: grid;
    grid-template-areas: 'number line';
    grid-template-columns: auto 10px;
    grid-template-rows: 7px;
    justify-items: end;
    align-items: center;
    column-gap: 10px;
    row-gap: 0;
`;

export const RulerMark = styled('div')`
    width: 10px;
    height: 1px;
    background-color: ${({ theme }) => theme.palette.text.primary};
    grid-area: line;
`;

export const RulerNumber = styled.div`
    font-family: Poppins, sans-serif;
    font-variant-numeric: tabular-nums;
    font-size: 11px;
    color: ${({ theme }) => theme.palette.text.primary};
    opacity: 0.16;
    text-align: right;
    font-weight: 700;
    line-height: 1.1;
    grid-area: number;
`;

export const BlockHeightAccent = styled.div<{ $content: string; $height?: number }>`
    width: 100vh;
    height: 100%;
    font-family: Druk, sans-serif;
    line-height: 1.1;
    letter-spacing: -1px;
    font-size: 110px;
    transform: rotate(-90deg) translate(0, calc(100vh - ${({ $height = 100 }) => `${$height * 100 - 20}px`}));
    position: fixed;
    z-index: -1;

    &:before {
        content: ${({ $content }) => $content || ''};
        position: absolute;
        width: 100%;
        color: ${({ theme }) => theme.palette.base};
        opacity: 0.4;
        transform: ${({ $height }) => ($height ? `scale(${$height})` : `scale(1.3)`)};
        text-align: center;
        z-index: -1;
    }
`;

export const BlockHeightText = styled.div`
    position: absolute;
    right: 20px;
    color: #000;
    text-align: right;
    font-family: Druk, sans-serif;
    font-size: 25px;
    font-weight: 700;
    line-height: normal;
`;
