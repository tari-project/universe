import styled, { css } from 'styled-components';
import * as m from 'motion/react-m';

export const Wrapper = styled(m.button)<{ $largeButton?: boolean }>`
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 10px;

    position: relative;
    overflow: hidden;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    line-height: 190%;

    white-space: nowrap;

    border-radius: 60px;
    border: 1px solid rgba(255, 255, 255, 0.1);

    height: 25px;
    padding: 0px 4px 0px 11px;

    cursor: pointer;
    transition: background 0.2s ease-in-out;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    ${({ $largeButton }) =>
        $largeButton &&
        css`
            height: 40px;
            padding: 0px 4px 0px 11px;
            border: none;
            background: #111;
            justify-content: center;

            &:hover {
                background: #222;
            }
        `}
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 17px;
    height: 17px;

    border-radius: 100px;
    background: #fff;
    color: #000;
`;

export const Copied = styled(m.div)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    color: #fff;
    background: #18d92f;

    display: flex;
    align-items: center;
    justify-content: center;

    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    line-height: 19px;
`;
