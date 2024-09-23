import styled from 'styled-components';

export const Wrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 100%;
    background-color: #4b65e0;
`;

export const Gems = styled('div')`
    color: #fff;
    text-align: center;
    font-family: Druk, sans-serif;
    font-size: 38px;
    font-weight: 700;
`;

export const Text = styled('div')`
    color: #fff;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: -0.36px;

    text-align: center;
`;
