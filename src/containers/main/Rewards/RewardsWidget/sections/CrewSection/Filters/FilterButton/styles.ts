import styled, { css } from 'styled-components';

export const Text = styled.div`
    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 11px;
    font-style: normal;
    font-weight: 600;
    line-height: 119.33%;
    letter-spacing: -0.33px;
`;

export const Number = styled.div`
    color: #000;
    font-family: Poppins, sans-serif;
    font-size: 8px;
    font-style: normal;
    font-weight: 600;
    line-height: 164.079%;
    letter-spacing: -0.672px;

    border-radius: 100px;
    background: #fff;

    display: flex;
    justify-content: center;
    align-items: center;

    width: 14px;
    height: 14px;
    padding: 2px;
`;

export const Wrapper = styled.button<{ $isActive: boolean }>`
    display: flex;

    justify-content: center;
    align-items: center;
    gap: 6px;

    padding: 4px 4px 4px 8px;

    border-radius: 50px;
    background: rgba(255, 255, 255, 0.1);

    ${({ $isActive }) =>
        $isActive &&
        css`
            background: #fff;

            ${Text} {
                color: #000;
            }

            ${Number} {
                color: #fff;
                background: #000;
            }
        `}
`;
