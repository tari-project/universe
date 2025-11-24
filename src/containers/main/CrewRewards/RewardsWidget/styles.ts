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

export const WidgetWrapper = styled('div')<{ $isOpen: boolean; $isLogin?: boolean }>`
    position: relative;
    z-index: 1;

    border-radius: 13px;
    background: #323333;

    box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25)
        ${({ theme }) => (theme.mode === 'dark' ? '' : ', 0px 0px 3px 2px rgba(242, 216, 255, 0.2) inset')};

    display: flex;
    flex-direction: column;
    justify-content: ${({ $isLogin }) => ($isLogin ? 'flex-end' : 'flex-start')};
    flex-shrink: 0;
    gap: 20px;

    width: ${({ $isLogin }) => ($isLogin ? '344px' : '411px')};
    height: 100%;
    padding: 20px 20px 0;

    max-height: 115px;

    transition: max-height 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    pointer-events: all;

    * {
        pointer-events: all;
    }

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
