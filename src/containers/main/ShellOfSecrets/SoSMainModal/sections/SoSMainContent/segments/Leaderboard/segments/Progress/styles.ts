import styled from 'styled-components';

export const Wrapper = styled('div')``;

export const TopLabel = styled('div')`
    display: flex;
    align-items: center;
    gap: 40px;
    width: 100%;
    position: relative;
`;

export const Line = styled('div')`
    width: 100%;
    height: 2px;
    background-color: #e6ff47;
`;

export const Text = styled('div')`
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
    line-height: 129.623%;
    text-transform: uppercase;
    white-space: nowrap;

    span {
        color: #e6ff47;
    }
`;

export const CapLeft = styled('div')`
    width: 2px;
    height: 8px;
    background-color: #e6ff47;

    position: absolute;
    top: 8px;
    left: 0;
`;

export const CapRight = styled('div')`
    width: 2px;
    height: 8px;
    background-color: #e6ff47;

    position: absolute;
    top: 8px;
    right: 0;
`;
