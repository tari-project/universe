import styled, { css } from 'styled-components';

export const StartWrapper = styled.button`
    position: relative;
    border-radius: 500px;
    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #188750;
    box-shadow:
        0px 0px 10px 0px rgba(104, 153, 55, 0.35),
        0px 0px 13px 0px rgba(255, 255, 255, 0.55) inset;
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

export const IconWrapper = styled.div<{ $absolute?: boolean }>`
    width: 27px;
    height: 27px;

    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    border-radius: 100%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(17px);

    ${({ $absolute }) =>
        $absolute &&
        css`
            position: absolute;
            top: 50%;
            left: 14px;
            transform: translateY(-50%);
        `}
`;
