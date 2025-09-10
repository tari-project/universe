import * as m from 'motion/react-m';
import styled, { css } from 'styled-components';

export const PositionWrapper = styled(m.div)`
    position: fixed;
    top: 0;
    right: 0;
    z-index: 2;
    pointer-events: none;
    height: 100%;
    padding: 12px;
`;

export const Holder = styled('div')`
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    pointer-events: none;
`;

export const WidgetWrapper = styled('div')<{ $isOpen: boolean; $isLogin?: boolean; $isHovering?: boolean }>`
    position: relative;
    z-index: 1;

    border-radius: 13px;
    background: #323333;

    box-shadow: 0px 4px 25px 0px rgba(0, 0, 0, 0.25)
        ${({ theme }) => (theme.mode === 'dark' ? '' : ', 0px 0px 3px 2px rgba(242, 216, 255, 0.2) inset')};

    display: flex;
    flex-direction: column;
    justify-content: ${({ $isLogin }) => ($isLogin ? 'flex-end' : 'flex-start')};
    flex-shrink: 0;
    gap: 20px;

    width: ${({ $isLogin }) => ($isLogin ? '344px' : '411px')};
    height: 100%;
    padding: 20px;
    padding-bottom: 0px;

    max-height: 115px;

    transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    pointer-events: all;

    * {
        pointer-events: all;
    }

    ${({ $isHovering }) =>
        $isHovering &&
        css`
            max-height: 163px;
        `}

    ${({ $isOpen }) =>
        $isOpen &&
        css`
            max-height: 830px;

            &:hover {
                max-height: 830px;
            }
        `}

    ${({ $isLogin }) =>
        $isLogin &&
        css`
            max-height: 274px;
        `}
`;

export const ExpandButtonWrapper = styled(m.div)`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;

    position: absolute;
    top: 115px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
`;

export const ExpandButton = styled.button`
    width: 100%;
    height: 33px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 0px 10px;

    color: #fff;
    font-family: Poppins, sans-serif;
    font-size: 10px;
    font-style: normal;
    font-weight: 700;
    line-height: 190%;

    white-space: nowrap;

    cursor: pointer;
    transition: background 0.2s ease-in-out;

    display: flex;
    align-items: center;
    justify-content: center;

    pointer-events: all;

    &:hover {
        background: #424343;
    }
`;
