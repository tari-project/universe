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

export const RulerContainer = styled.div`
    top: 50%;
    position: absolute;
    height: 100%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    align-items: end;
    justify-content: center;
`;

export const RulerMarkContainer = styled.div`
    display: grid;
    position: relative;
    grid-template-areas: 'number line';
    grid-template-columns: auto 10px;
    grid-template-rows: 7px;
    justify-items: end;
    align-items: center;
    column-gap: 20px;
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
    opacity: 0.2;
    text-align: right;
    font-weight: 700;
    line-height: 1.1;
    grid-area: number;
`;

export const BlockHeightText = styled.div`
    color: #000;
    text-align: right;
    font-family: Druk, sans-serif;
    font-size: 25px;
    font-weight: 700;
    line-height: normal;
`;
