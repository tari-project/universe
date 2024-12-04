import styled from 'styled-components';

export const Wrapper = styled('div')``;

export const SectionLabel = styled('div')`
    font-size: 23px;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
`;

export const TopBar = styled('div')`
    display: flex;
    align-items: center;
    gap: 16px;
`;

export const LineLeft = styled('div')`
    height: 2px;
    width: 21px;
    background-color: #e6ff47;
`;

export const LineRight = styled('div')`
    height: 2px;
    width: 71px;
    background-color: #e6ff47;
`;

export const LineBottom = styled('div')`
    height: 2px;
    width: 21px;
    background-color: #e6ff47;

    position: absolute;
    bottom: 0;
    left: 0;
`;

export const TimerColumn = styled('div')`
    position: relative;

    display: flex;
    flex-direction: column;
    gap: 5px;

    border-left: 2px solid #e6ff47;

    padding: 24px 26px 18px 26px;
    margin-top: -13px;
`;

export const NumberGroup = styled('div')`
    display: flex;
    gap: 2px;
    align-items: flex-end;
`;

export const Number = styled('div')`
    font-size: 153px;
    line-height: 80%;
    text-transform: uppercase;
`;

export const Label = styled('div')`
    font-size: 38px;
    line-height: 100%;
    text-transform: uppercase;
`;
