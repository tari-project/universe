import styled, { css } from 'styled-components';

export const StopWrapper = styled.div`
    position: relative;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #4c614a;
    box-shadow:
        0px 0px 10px 0px rgba(104, 153, 55, 0.35),
        0px 0px 13px 0px rgba(238, 255, 217, 0.5) inset;
`;

export const HitBox = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    height: 100%;

    outline: 1px solid red;
`;

export const Text = styled.div`
    color: #f0f1f1;
    text-align: center;

    font-family: Poppins, sans-serif;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 110%;
    letter-spacing: -0.48px;
`;
