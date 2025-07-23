import styled, { css } from 'styled-components';

export const Wrapper = styled.div<{ $isOpen: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    border-radius: 10px;
    background: #00a505;

    padding: 8px 10px;
    min-height: 33px;
    width: 100%;
    position: relative;
    z-index: 1;
    pointer-events: all;

    * {
        pointer-events: all;
    }

    ${({ $isOpen }) =>
        !$isOpen &&
        css`
            position: absolute;
            top: 95px;
            left: 0;
            z-index: 0;
            padding: 30px 14px 11px 14px;
        `}
`;

export const Text = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 131.263%;
    letter-spacing: -0.3px;
`;

export const StreakText = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 109.386%;
    letter-spacing: -0.36px;
`;
